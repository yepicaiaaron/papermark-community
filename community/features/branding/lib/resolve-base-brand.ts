import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

/** Fields the document and data room viewers need from a team brand. */
export const teamBrandViewerSelect = {
  logo: true,
  hideLogo: true,
  banner: true,
  brandColor: true,
  accentColor: true,
  accentButtonColor: true,
  applyAccentColorToDataroomView: true,
  welcomeMessage: true,
  ctaLabel: true,
  ctaUrl: true,
  privacyPolicyUrl: true,
  cardLayout: true,
  showFolderTree: true,
  viewerLayoutPreset: true,
  viewerHeaderStyle: true,
  hideFolderIconsInMain: true,
  defaultLanguage: true,
} satisfies Prisma.BrandSelect;

/** Fields for the social preview (Open Graph) of a shared link. */
export const teamBrandOgSelect = {
  customLinkPreviewEnabled: true,
  linkPreviewTitle: true,
  linkPreviewDescription: true,
  linkPreviewImage: true,
  linkPreviewFavicon: true,
} satisfies Prisma.BrandSelect;

/** Fields for the workflow entry screen. */
export const teamBrandWorkflowSelect = {
  logo: true,
  hideLogo: true,
  brandColor: true,
  accentColor: true,
  accentButtonColor: true,
  welcomeMessage: true,
  privacyPolicyUrl: true,
  defaultLanguage: true,
} satisfies Prisma.BrandSelect;

/**
 * Which team brand applies: the link's own brand, then the data room's
 * chosen brand, then the team's default, then the team's oldest brand.
 */
async function pickBrandId({
  teamId,
  linkBrandId,
  dataroomBrandId,
}: {
  teamId: string;
  linkBrandId?: string | null;
  dataroomBrandId?: string | null;
}): Promise<string | null> {
  for (const id of [linkBrandId, dataroomBrandId]) {
    if (!id) continue;
    const owned = await prisma.brand.findFirst({
      where: { id, teamId },
      select: { id: true },
    });
    if (owned) return owned.id;
  }
  return resolveDefaultBrandId(teamId);
}

export async function resolveBaseBrand<S extends Prisma.BrandSelect>({
  teamId,
  linkBrandId,
  dataroomBrandId,
  select,
}: {
  teamId: string;
  linkBrandId?: string | null;
  dataroomBrandId?: string | null;
  select: S;
}): Promise<Prisma.BrandGetPayload<{ select: S }> | null> {
  const id = await pickBrandId({ teamId, linkBrandId, dataroomBrandId });
  if (!id) return null;
  return (await prisma.brand.findUnique({
    where: { id },
    select,
  })) as Prisma.BrandGetPayload<{ select: S }> | null;
}

export async function resolveDefaultBrandId(
  teamId: string,
): Promise<string | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { defaultBrandId: true },
  });
  if (team?.defaultBrandId) return team.defaultBrandId;
  const first = await prisma.brand.findFirst({
    where: { teamId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id ?? null;
}

/** Returns the brand id only if it belongs to the team, otherwise null. */
export async function resolveOwnedBrandId(
  teamId: string,
  brandId: string | null | undefined,
): Promise<string | null> {
  if (!brandId) return null;
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, teamId },
    select: { id: true },
  });
  return brand?.id ?? null;
}

export async function findDefaultBrand(teamId: string) {
  const id = await resolveDefaultBrandId(teamId);
  if (!id) return null;
  return prisma.brand.findUnique({ where: { id } });
}

/**
 * Creates the team's default brand or updates it, and makes sure the team
 * points at it.
 */
export async function persistDefaultBrand({
  teamId,
  create,
  update,
}: {
  teamId: string;
  create: Prisma.BrandUncheckedCreateInput;
  update: Prisma.BrandUncheckedUpdateInput;
}) {
  const existingId = await resolveDefaultBrandId(teamId);
  return prisma.$transaction(async (tx) => {
    const brand = existingId
      ? await tx.brand.update({ where: { id: existingId }, data: update })
      : await tx.brand.create({ data: { ...create, teamId } });
    await tx.team.update({
      where: { id: teamId },
      data: { defaultBrandId: brand.id },
    });
    return brand;
  });
}
