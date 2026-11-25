import type { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

/**
 * Community edition billing endpoints. There is no billing: every team is
 * on the unlimited plan, so these report that and refuse plan changes.
 */
async function memberTeam(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).end("Unauthorized");
    return null;
  }
  const teamId = req.query.teamId as string;
  const userId = (session.user as CustomUser).id;
  const team = await prisma.team.findFirst({
    where: { id: teamId, users: { some: { userId } } },
    select: { id: true, plan: true, createdAt: true },
  });
  if (!team) {
    res.status(404).end("Team not found");
    return null;
  }
  return team;
}

export async function planHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const team = await memberTeam(req, res);
  if (!team) return;
  const plan =
    !team.plan || team.plan === "free" ? "datarooms-unlimited" : team.plan;
  return res.status(200).json({
    plan,
    startsAt: team.createdAt,
    endsAt: null,
    pausedAt: null,
    pauseStartsAt: null,
    pauseEndsAt: null,
    isPaused: false,
    cancelledAt: null,
    trialEndsAt: null,
    isCustomer: false,
    subscriptionCycle: "yearly",
    discount: null,
  });
}

export async function invoicesHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const team = await memberTeam(req, res);
  if (!team) return;
  return res.status(200).json({ invoices: [] });
}

export async function currencyHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const team = await memberTeam(req, res);
  if (!team) return;
  return res.status(200).json({ currency: "usd" });
}

export async function noBillingHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const team = await memberTeam(req, res);
  if (!team) return;
  return res.status(400).json({
    error:
      "Billing isn't used in the community edition. Every workspace is unlimited.",
  });
}
