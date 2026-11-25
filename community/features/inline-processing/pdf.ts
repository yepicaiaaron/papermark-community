import { ONE_HOUR } from "@/lib/constants";
import { qstash } from "@/lib/cron";
import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { convertPdfToImageRoute } from "@/lib/trigger/pdf-to-image-route";

/**
 * Community edition: turn PDF pages into images without Trigger.dev.
 *
 * With COMMUNITY_INLINE_PROCESSING="true", uploads queue a QStash message
 * to /api/internal/community/process-pdf, which runs the same steps the
 * Trigger.dev task does (page count, then each page through the app's own
 * /api/mupdf routes) inside a Vercel function. Otherwise the Trigger.dev
 * task is used as upstream does.
 */
export type PdfToImagePayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
  versionNumber?: number;
};

export function inlineProcessingEnabled() {
  return process.env.COMMUNITY_INLINE_PROCESSING === "true";
}

export async function startPdfToImage(
  payload: PdfToImagePayload,
  options?: Parameters<typeof convertPdfToImageRoute.trigger>[1],
) {
  if (!inlineProcessingEnabled()) {
    return convertPdfToImageRoute.trigger(payload, options);
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  await qstash.publishJSON({
    url: `${base}/api/internal/community/process-pdf`,
    body: payload,
    headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` },
    retries: 2,
  });
  return null;
}

async function internal(path: string, body: unknown) {
  return fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
    },
  });
}

export async function processPdfToImages(payload: PdfToImagePayload) {
  const { documentId, documentVersionId, teamId, versionNumber } = payload;

  const version = await prisma.documentVersion.findUnique({
    where: { id: documentVersionId },
    select: { file: true, storageType: true, numPages: true, hasPages: true },
  });
  if (!version) throw new Error("Document version not found");
  if (version.hasPages) return { skipped: true };

  const signedUrl = await getFile({
    type: version.storageType,
    data: version.file,
    expiresIn: ONE_HOUR,
  });
  if (!signedUrl) throw new Error("Could not get a link to the file");

  let numPages = version.numPages ?? 0;
  if (!numPages || numPages === 1) {
    const res = await internal("/api/mupdf/get-pages", { url: signedUrl });
    if (!res.ok) throw new Error(`Page count failed (${res.status})`);
    numPages = ((await res.json()) as { numPages: number }).numPages;
    if (!numPages || numPages < 1) throw new Error("Invalid page count");
  }

  // A few pages at a time keeps this well inside the function time limit.
  const BATCH = 4;
  for (let start = 1; start <= numPages; start += BATCH) {
    const pages = Array.from(
      { length: Math.min(BATCH, numPages - start + 1) },
      (_, i) => start + i,
    );
    await Promise.all(
      pages.map(async (pageNumber) => {
        const exists = await prisma.documentPage.findFirst({
          where: { versionId: documentVersionId, pageNumber },
          select: { id: true },
        });
        if (exists) return;
        const res = await internal("/api/mupdf/convert-page", {
          documentVersionId,
          pageNumber,
          url: signedUrl,
          teamId,
          trustedTeam: false,
        });
        if (!res.ok) {
          throw new Error(`Page ${pageNumber} failed (${res.status})`);
        }
      }),
    );
  }

  await prisma.documentVersion.update({
    where: { id: documentVersionId },
    data: { numPages, hasPages: true, isPrimary: true },
  });
  await prisma.document
    .update({ where: { id: documentId }, data: { numPages } })
    .catch(() => {});
  if (versionNumber) {
    await prisma.documentVersion.updateMany({
      where: { documentId, versionNumber: { not: versionNumber } },
      data: { isPrimary: false },
    });
  }

  await fetch(
    `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
  ).catch(() => {});

  return { numPages };
}
