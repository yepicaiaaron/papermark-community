/**
 * Community edition has no paid plans. These names exist so the AGPL
 * billing screens still compile; nothing here is ever charged.
 */
export enum PlanEnum {
  Free = "Free",
  Pro = "Pro",
  Business = "Business",
  DataRooms = "Data Rooms",
  DataRoomsPlus = "Data Rooms Plus",
  DataRoomsPremium = "Data Rooms Premium",
  DataRoomsUnlimited = "Data Rooms Unlimited",
}

export const PLAN_NAME_MAP: Record<string, string> = {
  free: "Community",
  starter: "Community",
  pro: "Community",
  trial: "Community",
  business: "Community",
  datarooms: "Community",
  "datarooms-plus": "Community",
  "datarooms-premium": "Community",
  "datarooms-unlimited": "Community",
};

export type Feature = {
  id: string;
  text: string;
  tooltip?: string;
  aliasIds?: string[];
  isHighlighted?: boolean;
  isNotIncluded?: boolean;
  isUsers?: boolean;
  isCustomDomain?: boolean;
};

export function getPlanFeatures(
  _plan: PlanEnum | string,
  _options: {
    period?: "monthly" | "yearly";
    currency?: string;
    highlightFeatures?: string[];
    maxFeatures?: number;
  } = {},
): { featureIntro: string; features: Feature[] } {
  return {
    featureIntro: "Everything is included in the community edition:",
    features: [
      { id: "unlimited", text: "Unlimited documents, links and data rooms" },
    ],
  };
}
