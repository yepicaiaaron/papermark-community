import { PlanEnum } from "./constants";

type Price = {
  amount: number;
  amountUsd?: number;
  priceIds: Record<string, Record<"old" | "new", string>>;
};

export type CommunityPlan = {
  name: string;
  slug: string;
  minQuantity: number;
  price: { monthly: Price; yearly: Price };
};

const free: Price = {
  amount: 0,
  amountUsd: 0,
  priceIds: {
    test: { old: "", new: "" },
    production: { old: "", new: "" },
  },
};

/**
 * The AGPL billing screens look plans up by name. The community edition has
 * no billing, so every plan is listed at zero and nothing can be bought.
 */
export const PLANS: CommunityPlan[] = Object.values(PlanEnum).map((name) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  minQuantity: 1,
  price: { monthly: free, yearly: free },
}));

export function isOldAccount(_plan?: string | null) {
  return false;
}
