import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

/**
 * Saves a data room's own brand and stops it inheriting a team brand, so the
 * custom settings are what visitors see.
 */
export async function upsertDataroomBrandAndClearInherited({
  dataroomId,
  teamId,
  data,
}: {
  dataroomId: string;
  teamId: string;
  data: Omit<Prisma.DataroomBrandUncheckedCreateInput, "dataroomId">;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.dataroom.update({
      where: { id: dataroomId, teamId },
      data: { brandId: null },
    });
    return tx.dataroomBrand.upsert({
      where: { dataroomId },
      create: { ...data, dataroomId },
      update: data as Prisma.DataroomBrandUncheckedUpdateInput,
    });
  });
}
