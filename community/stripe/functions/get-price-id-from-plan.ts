/** No paid plans in the community edition, so there are no price ids. */
export function getPriceIdFromPlan(_args: Record<string, unknown>): string {
  return "";
}
