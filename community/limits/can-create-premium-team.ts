export const PREMIUM_TEAM_LIMIT = Number.POSITIVE_INFINITY;

/**
 * Every user can create teams in the community edition. Callers ask
 * canCreateUnlimitedTeam first, which always says yes, so this is a
 * fallback.
 */
export async function getPremiumTeamEligibility(_userId?: string) {
  return {
    isPremiumAdmin: false,
    canCreate: true,
    count: 0,
    limit: PREMIUM_TEAM_LIMIT,
  };
}
