/**
 * Community edition: no plan tiers. Every team gets everything.
 */
export const COMMUNITY_PLAN = "datarooms-unlimited";

export type CommunityLimits = {
  users: number | null;
  links: number | null;
  documents: number | null;
  domains: number | null;
  datarooms: number | null;
  customDomainOnPro: boolean;
  customDomainInDataroom: boolean;
  advancedLinkControlsOnPro: boolean;
  watermarkOnBusiness: boolean;
  agreementOnBusiness: boolean;
  conversationsInDataroom: boolean;
  dataroomUpload: boolean;
  linkCustomFields: number | null;
  fileSizeLimits: {
    video: number | null;
    document: number | null;
    image: number | null;
    excel: number | null;
    maxFiles: number | null;
    maxPages: number | null;
  };
};

const envNumber = (name: string): number | null => {
  const raw = process.env[name];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Upload size caps in MB. Leave the env vars unset for the app defaults. */
export function communityLimits(): CommunityLimits {
  return {
    users: null,
    links: null,
    documents: null,
    domains: null,
    datarooms: null,
    customDomainOnPro: true,
    customDomainInDataroom: true,
    advancedLinkControlsOnPro: true,
    watermarkOnBusiness: true,
    agreementOnBusiness: true,
    // Q&A conversations are not part of the community edition.
    conversationsInDataroom: false,
    dataroomUpload: false,
    linkCustomFields: null,
    fileSizeLimits: {
      video: envNumber("COMMUNITY_MAX_VIDEO_MB") ?? 500,
      document: envNumber("COMMUNITY_MAX_DOCUMENT_MB") ?? 350,
      image: envNumber("COMMUNITY_MAX_IMAGE_MB") ?? 100,
      excel: envNumber("COMMUNITY_MAX_EXCEL_MB") ?? 40,
      maxFiles: null,
      maxPages: envNumber("COMMUNITY_MAX_PAGES") ?? 500,
    },
  };
}
