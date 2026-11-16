import { z } from "zod";

import prisma from "@/lib/prisma";

/**
 * API token helpers. Upstream Papermark imports this file but does not
 * publish it; this is an independent implementation for the community
 * edition.
 *
 * "user" keys belong to a person and stop working when that person leaves
 * the team. "machine" keys belong to the team.
 */
export const RestrictedTokenSubjectTypeSchema = z.enum(["user", "machine"]);
export type RestrictedTokenSubjectType = z.infer<
  typeof RestrictedTokenSubjectTypeSchema
>;

export function parseRestrictedTokenSubjectType(
  value: string | null | undefined,
): RestrictedTokenSubjectType {
  const parsed = RestrictedTokenSubjectTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "user";
}

/** Deletes a departing member's personal API keys for the team. */
export async function revokeUserBoundTeamTokens(
  userId: string,
  teamId: string,
) {
  return prisma.restrictedToken.deleteMany({
    where: { userId, teamId, subjectType: "user" },
  });
}
