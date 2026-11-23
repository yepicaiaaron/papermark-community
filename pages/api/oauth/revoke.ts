import type { NextApiRequest, NextApiResponse } from "next";

import { revokeToken } from "@/community/features/oauth";
import { bodyParams, cors } from "@/community/features/oauth/http";

/** RFC 7009: always answers 200. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();
  await revokeToken(bodyParams(req).token);
  return res.status(200).end();
}
