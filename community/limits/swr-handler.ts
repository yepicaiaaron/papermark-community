import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import type { CommunityLimits } from "./plan";

// Callers check these caps with `!= null` before doing arithmetic, so they
// are typed as numbers here; at runtime null means "no limit".
type LimitsResponse = Omit<CommunityLimits, "documents" | "links" | "users"> & {
  documents: number;
  links: number;
  users: number;
  usage: { documents: number; links: number; users: number };
};

const under = (limit: number | null | undefined, used = 0) =>
  limit === null || limit === undefined || used < limit;

export function useLimits() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, error, mutate } = useSWR<LimitsResponse | null>(
    teamId ? `/api/teams/${teamId}/limits` : null,
    fetcher,
    { dedupingInterval: 30000 },
  );

  return {
    limits: data ?? null,
    canAddDocuments: under(data?.documents, data?.usage?.documents),
    canAddLinks: under(data?.links, data?.usage?.links),
    canAddUsers: under(data?.users, data?.usage?.users),
    showUpgradePlanModal: false,
    isPaused: false,
    error,
    mutate,
    loading: !data && !error && !!teamId,
  };
}
