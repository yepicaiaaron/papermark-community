import type { NextApiRequest, NextApiResponse } from "next";

import { processPdfToImages } from "@/community/features/inline-processing/pdf";

export const config = { maxDuration: 300 };

/** Community edition: page images for a PDF, run inside the app. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();
  const auth = req.headers.authorization;
  if (
    !process.env.INTERNAL_API_KEY ||
    auth !== `Bearer ${process.env.INTERNAL_API_KEY}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  if (!body?.documentVersionId || !body?.documentId || !body?.teamId) {
    return res.status(400).json({ error: "Missing ids" });
  }
  try {
    const result = await processPdfToImages(body);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[process-pdf]", error);
    return res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Failed" });
  }
}
