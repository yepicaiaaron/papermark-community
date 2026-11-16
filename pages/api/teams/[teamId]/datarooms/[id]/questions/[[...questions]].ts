import { NextApiRequest, NextApiResponse } from "next";

import { handleRoute } from "@/community/features/conversations/api/team-questions-route";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return handleRoute(req, res);
}
