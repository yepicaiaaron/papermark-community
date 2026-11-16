export type BrandLogoFields = {
  logo?: string | null;
  hideLogo?: boolean | null;
};

export type ResolvedBrandLogo =
  | { kind: "custom"; src: string }
  | { kind: "papermark" }
  | { kind: "none" };

/**
 * Decides what goes in the viewer's logo slot. The community edition is
 * unbranded: with no uploaded logo the slot stays empty rather than showing
 * the Papermark wordmark.
 */
export function resolveBrandLogo(
  brand: BrandLogoFields | null | undefined,
): ResolvedBrandLogo {
  if (!brand || brand.hideLogo) return { kind: "none" };
  if (brand.logo) return { kind: "custom", src: brand.logo };
  return { kind: "none" };
}
