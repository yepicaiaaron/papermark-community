import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { ONE_HOUR } from "@/lib/constants";
import { getFile } from "@/lib/files/get-file";
import { putFileServer } from "@/lib/files/put-file-server";
import prisma from "@/lib/prisma";
import { convertPdfToImageRoute } from "@/lib/trigger/pdf-to-image-route";
import { updateStatus } from "@/lib/utils/generate-trigger-status";

const run = promisify(execFile);

type ConvertPayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
  versionNumber?: number;
};

const EXTENSION_BY_TYPE: Record<string, string> = {
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "application/vnd.oasis.opendocument.text": ".odt",
  "application/vnd.oasis.opendocument.presentation": ".odp",
  "application/rtf": ".rtf",
  "text/rtf": ".rtf",
  "text/plain": ".txt",
  "application/vnd.apple.keynote": ".key",
  "application/x-iwork-keynote-sffkey": ".key",
};

/**
 * Converts an uploaded office file to PDF with LibreOffice (installed into
 * the task image by trigger.config.ts), stores the PDF, then hands over to
 * the normal PDF-to-image pipeline.
 */
async function convertToPdf(payload: ConvertPayload) {
  const { documentId, documentVersionId, teamId, versionNumber } = payload;

  updateStatus({ progress: 0, text: "Preparing conversion..." });

  const version = await prisma.documentVersion.findUnique({
    where: { id: documentVersionId },
    select: {
      file: true,
      originalFile: true,
      storageType: true,
      contentType: true,
    },
  });
  if (!version) {
    throw new AbortTaskRunError("Document version not found");
  }

  const sourceKey = version.originalFile ?? version.file;
  const signedUrl = await getFile({
    type: version.storageType,
    data: sourceKey,
    expiresIn: ONE_HOUR,
  });
  if (!signedUrl) {
    throw new AbortTaskRunError("Could not get a download URL for the file");
  }

  updateStatus({ progress: 10, text: "Downloading file..." });
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const input = Buffer.from(await response.arrayBuffer());

  const workDir = await mkdtemp(path.join(tmpdir(), "convert-"));
  try {
    const ext =
      path.extname(sourceKey.split("?")[0]) ||
      EXTENSION_BY_TYPE[version.contentType ?? ""] ||
      ".docx";
    const inputPath = path.join(workDir, `input${ext}`);
    await writeFile(inputPath, input);

    updateStatus({ progress: 30, text: "Converting to PDF..." });
    await run(
      "soffice",
      [
        "--headless",
        "--norestore",
        `-env:UserInstallation=file://${workDir}/profile`,
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        inputPath,
      ],
      { timeout: 10 * 60 * 1000 },
    );

    const pdfName = (await readdir(workDir)).find((f) => f.endsWith(".pdf"));
    if (!pdfName) {
      throw new AbortTaskRunError("LibreOffice did not produce a PDF");
    }
    const pdf = await readFile(path.join(workDir, pdfName));

    updateStatus({ progress: 60, text: "Saving PDF..." });
    const baseName = path.basename(sourceKey.split("?")[0], ext) || "document";
    const { data } = await putFileServer({
      file: {
        name: `${baseName}.pdf`,
        type: "application/pdf",
        buffer: pdf,
      },
      teamId,
      docId: documentId,
    });
    if (!data) {
      throw new Error("Failed to store the converted PDF");
    }

    await prisma.documentVersion.update({
      where: { id: documentVersionId },
      data: { file: data },
    });

    logger.info("Converted to PDF", { documentVersionId });
    updateStatus({ progress: 70, text: "Rendering pages..." });

    await convertPdfToImageRoute.trigger(
      { documentId, documentVersionId, teamId, versionNumber },
      { idempotencyKey: `${teamId}-${documentVersionId}-pages` },
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export const convertFilesToPdfTask = task({
  id: "convert-files-to-pdf",
  machine: { preset: "medium-1x" },
  retry: { maxAttempts: 2 },
  run: convertToPdf,
});

export const convertKeynoteToPdfTask = task({
  id: "convert-keynote-to-pdf",
  machine: { preset: "medium-1x" },
  retry: { maxAttempts: 2 },
  run: convertToPdf,
});
