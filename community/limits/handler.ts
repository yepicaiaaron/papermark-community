import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { getLimits } from "./server";

export default async function limitsHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).end("Unauthorized");

  const userId = (session.user as CustomUser).id;
  const { teamId } = req.query as { teamId: string };

  const membership = await prisma.userTeam.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { teamId: true },
  });
  if (!membership) return res.status(403).end("Forbidden");

  try {
    return res.status(200).json(await getLimits({ teamId, userId }));
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
