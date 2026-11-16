/** Select value meaning "this data room has its own brand". */
export const CUSTOM_DATAROOM_BRAND = "__custom_dataroom_brand__";
export const CUSTOM_DATAROOM_BRAND_LABEL = "Custom brand for this data room";

/**
 * A data room uses a team brand when the link or the data room points at
 * one, or when the data room has no brand of its own.
 */
export function inheritsTeamBrand({
  linkBrandId,
  dataroomBrandId,
  hasDataroomBrand,
}: {
  linkBrandId?: string | null;
  dataroomBrandId?: string | null;
  hasDataroomBrand: boolean;
}): boolean {
  return Boolean(linkBrandId) || Boolean(dataroomBrandId) || !hasDataroomBrand;
}

type BrandLike = Record<string, unknown>;

/**
 * The brand a visitor sees. A data room's own brand wins field by field;
 * anything it leaves empty falls back to the team brand.
 */
export function resolveDisplayedDataroomBrand<
  D extends BrandLike | null,
  T extends BrandLike | null,
>({
  dataroomBrand,
  teamBrand,
  inheritTeamBrand,
}: {
  dataroomBrand: D;
  teamBrand: T;
  inheritTeamBrand: boolean;
}): (NonNullable<D> & NonNullable<T>) | null {
  if (inheritTeamBrand || !dataroomBrand) {
    return (teamBrand ?? null) as (NonNullable<D> & NonNullable<T>) | null;
  }
  const merged: BrandLike = { ...(teamBrand ?? {}) };
  for (const [key, value] of Object.entries(dataroomBrand)) {
    if (value !== null && value !== undefined) merged[key] = value;
  }
  return merged as NonNullable<D> & NonNullable<T>;
}
