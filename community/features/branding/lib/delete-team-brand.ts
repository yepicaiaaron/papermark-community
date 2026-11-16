import type { Brand } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  clearCachedBrandLogo,
  writeCachedBrandLogo,
} from "@/lib/redis/brand-logo-cache";

/**
 * Deletes a team brand. Links and data rooms that used it fall back to the
 * team default. If it was the default, the oldest remaining brand takes over.
 */
export async function deleteTeamBrand({
  teamId,
  brand,
}: {
  teamId: string;
  brand: Pick<Brand, "id">;
}) {
  const nextDefault = await prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      select: { defaultBrandId: true },
    });

    await tx.link.updateMany({
      where: { teamId, brandId: brand.id },
      data: { brandId: null },
    });
    await tx.dataroom.updateMany({
      where: { teamId, brandId: brand.id },
      data: { brandId: null },
    });
    await tx.brand.delete({ where: { id: brand.id } });

    if (team?.defaultBrandId !== brand.id) return undefined;

    const replacement = await tx.brand.findFirst({
      where: { teamId },
      orderBy: { createdAt: "asc" },
    });
    await tx.team.update({
      where: { id: teamId },
      data: { defaultBrandId: replacement?.id ?? null },
    });
    return replacement ?? null;
  });

  if (nextDefault === null) {
    await clearCachedBrandLogo(teamId);
  } else if (nextDefault) {
    await writeCachedBrandLogo(teamId, nextDefault);
  }
}
