import { hashToken } from "@/lib/api/auth/token";
import prisma from "@/lib/prisma";

/**
 * Community edition MCP server: who is calling.
 *
 * Callers send `Authorization: Bearer <key>`. The key is either an API key
 * made in Settings > API tokens, or an access token issued by the
 * community OAuth flow (used by claude.ai and other hosted MCP clients).
 * Both are stored as RestrictedToken rows, hashed.
 */
export type McpAuth = {
  tokenId: string;
  teamId: string;
  userId: string;
  scopes: string[];
};

export async function authenticateMcpRequest(
  req: Request,
): Promise<McpAuth | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const raw = match?.[1]?.trim();
  if (!raw) return null;

  const token = await prisma.restrictedToken.findUnique({
    where: { hashedKey: hashToken(raw) },
    select: {
      id: true,
      teamId: true,
      userId: true,
      scopes: true,
      expires: true,
      subjectType: true,
    },
  });
  if (!token) return null;
  if (token.expires && token.expires.getTime() < Date.now()) return null;

  // Personal keys stop working once the person leaves the team.
  if (token.subjectType !== "machine") {
    const member = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: { userId: token.userId, teamId: token.teamId },
      },
      select: { userId: true },
    });
    if (!member) return null;
  }

  prisma.restrictedToken
    .update({ where: { id: token.id }, data: { lastUsed: new Date() } })
    .catch(() => {});

  return {
    tokenId: token.id,
    teamId: token.teamId,
    userId: token.userId,
    scopes: (token.scopes ?? "apis.all").split(/\s+/).filter(Boolean),
  };
}

/** `documents.read`, `links.write` and so on. */
export function hasScope(auth: McpAuth, scope: string) {
  if (auth.scopes.includes("apis.all")) return true;
  if (auth.scopes.includes("apis.read") && scope.endsWith(".read")) return true;
  if (auth.scopes.includes(scope)) return true;
  // write implies read for the same resource
  if (scope.endsWith(".read")) {
    return auth.scopes.includes(scope.replace(/\.read$/, ".write"));
  }
  return false;
}
