import type { NextApiRequest, NextApiResponse } from "next";

/** Not part of the community edition. */
export default async function publishFAQRoute(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  return res.status(404).json({ error: "Not available in this edition" });
}
