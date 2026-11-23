import type { NextApiRequest, NextApiResponse } from "next";

import { protectedResourceMetadata } from "@/community/features/oauth";
import { cors } from "@/community/features/oauth/http";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (cors(req, res)) return;
  res.status(200).json(protectedResourceMetadata());
}
