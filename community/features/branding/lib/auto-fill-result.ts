export const AUTO_FILL_NOT_FOUND_MESSAGE =
  "We couldn't find a logo or colours on that site.";

export function autoFillHasBrandAssets(
  data: {
    logo?: string | null;
    banner?: string | null;
    brandColor?: string | null;
    accentColor?: string | null;
    accentButtonColor?: string | null;
  } | null,
  { allowBanner }: { allowBanner: boolean },
): boolean {
  if (!data) return false;
  return Boolean(
    data.logo ||
    data.brandColor ||
    data.accentColor ||
    data.accentButtonColor ||
    (allowBanner && data.banner),
  );
}
