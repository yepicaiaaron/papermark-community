import prisma from "@/lib/prisma";

import { communityLimits } from "./plan";

export async function getLimits({
  teamId,
}: {
  teamId: string;
  userId?: string;
}) {
  const [documents, links, users] = await Promise.all([
    prisma.document.count({ where: { teamId } }),
    prisma.link.count({
      where: { teamId, deletedAt: null, isArchived: false },
    }),
    prisma.userTeam.count({ where: { teamId } }),
  ]);

  return {
    ...communityLimits(),
    usage: { documents, links, users },
  };
}
