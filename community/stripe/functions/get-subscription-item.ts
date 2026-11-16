export type SubscriptionDiscount = {
  valid: boolean;
  couponId: string;
  percentOff: number | null;
  amountOff: number | null;
  duration: string;
  durationInMonths: number | null;
  validUntil: number | null;
  isFirstTime?: boolean;
};
