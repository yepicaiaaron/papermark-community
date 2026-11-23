import { createHash, randomBytes } from "crypto";

import { hashToken } from "@/lib/api/auth/token";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";

/**
 * Community edition OAuth 2.1 server for the MCP endpoint.
 *
 * Small on purpose: public clients only (PKCE S256), dynamic client
 * registration, authorization code and refresh token grants. Access tokens
 * are RestrictedToken rows (source "oauth"), so the MCP server checks them
 * exactly like API keys. Codes and refresh tokens live in OAuthRecord,
 * stored by hash.
 */

export const OAUTH_SCOPES = ["apis.all", "apis.read"] as const;
export const ACCESS_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const CODE_TTL_MS = 10 * 60 * 1000;
const REFRESH_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export function issuer() {
  return (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
}

export function authorizationServerMetadata() {
  const base = issuer();
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    revocation_endpoint: `${base}/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [...OAUTH_SCOPES],
  };
}

export function protectedResourceMetadata() {
  const base = issuer();
  return {
    resource: `${base}/mcp`,
    authorization_servers: [base],
    scopes_supported: [...OAUTH_SCOPES],
    bearer_methods_supported: ["header"],
    resource_name: "Papermark",
  };
}

export function normaliseScope(scope: string | undefined | null) {
  const asked = (scope ?? "").split(/\s+/).filter(Boolean);
  return asked.includes("apis.read") && !asked.includes("apis.all")
    ? "apis.read"
    : "apis.all";
}

export function isAllowedRedirectUri(uri: string) {
  try {
    const url = new URL(uri);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    if (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ) {
      return true;
    }
    // Native apps (e.g. cursor://, vscode://) use private schemes.
    return /^[a-z][a-z0-9+.-]*:$/.test(url.protocol) &&
      !["http:", "javascript:", "data:", "file:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export async function findClient(clientId: string | undefined | null) {
  if (!clientId) return null;
  return prisma.oAuthClient.findUnique({ where: { clientId } });
}

function verifyPkce(verifier: string, challenge: string) {
  const digest = createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return digest === challenge;
}

type CodePayload = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
  teamId: string;
  userId: string;
};

export async function createAuthorizationCode(payload: CodePayload) {
  const code = randomBytes(32).toString("base64url");
  await prisma.oAuthRecord.create({
    data: {
      id: hashToken(`code:${code}`),
      kind: "AuthorizationCode",
      payload,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  return code;
}

async function mintTokens(args: {
  clientRowId: string;
  clientName: string;
  clientId: string;
  teamId: string;
  userId: string;
  scope: string;
}) {
  const accessToken = newId("tokenLive");
  await prisma.restrictedToken.create({
    data: {
      name: `${args.clientName} (connected app)`,
      hashedKey: hashToken(accessToken),
      partialKey: `${accessToken.slice(0, 11)}...${accessToken.slice(-4)}`,
      scopes: args.scope,
      mode: "live",
      source: "oauth",
      subjectType: "user",
      clientId: args.clientRowId,
      teamId: args.teamId,
      userId: args.userId,
      expires: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
    },
  });

  const refreshToken = `pmr_${randomBytes(32).toString("base64url")}`;
  await prisma.oAuthRecord.create({
    data: {
      id: hashToken(`refresh:${refreshToken}`),
      kind: "RefreshToken",
      payload: {
        clientId: args.clientId,
        teamId: args.teamId,
        userId: args.userId,
        scope: args.scope,
      },
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    scope: args.scope,
  };
}

export class OAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function exchangeAuthorizationCode(params: {
  code?: string;
  clientId?: string;
  redirectUri?: string;
  codeVerifier?: string;
}) {
  const { code, clientId, redirectUri, codeVerifier } = params;
  if (!code || !clientId || !codeVerifier) {
    throw new OAuthError("invalid_request", "Missing code, client_id or code_verifier");
  }
  const id = hashToken(`code:${code}`);
  const record = await prisma.oAuthRecord.findUnique({ where: { id } });
  if (
    !record ||
    record.kind !== "AuthorizationCode" ||
    record.consumedAt ||
    (record.expiresAt && record.expiresAt < new Date())
  ) {
    throw new OAuthError("invalid_grant", "Code is invalid or expired");
  }
  // Single use, even if the rest fails.
  await prisma.oAuthRecord.update({
    where: { id },
    data: { consumedAt: new Date() },
  });

  const payload = record.payload as CodePayload;
  if (payload.clientId !== clientId) {
    throw new OAuthError("invalid_grant", "Code was issued to another client");
  }
  if (redirectUri && redirectUri !== payload.redirectUri) {
    throw new OAuthError("invalid_grant", "redirect_uri does not match");
  }
  if (!verifyPkce(codeVerifier, payload.codeChallenge)) {
    throw new OAuthError("invalid_grant", "PKCE check failed");
  }

  const client = await findClient(clientId);
  if (!client) throw new OAuthError("invalid_client", "Unknown client", 401);

  return mintTokens({
    clientRowId: client.id,
    clientName: client.clientName,
    clientId: client.clientId,
    teamId: payload.teamId,
    userId: payload.userId,
    scope: payload.scope,
  });
}

export async function exchangeRefreshToken(params: {
  refreshToken?: string;
  clientId?: string;
}) {
  const { refreshToken, clientId } = params;
  if (!refreshToken || !clientId) {
    throw new OAuthError("invalid_request", "Missing refresh_token or client_id");
  }
  const id = hashToken(`refresh:${refreshToken}`);
  const record = await prisma.oAuthRecord.findUnique({ where: { id } });
  if (
    !record ||
    record.kind !== "RefreshToken" ||
    record.consumedAt ||
    (record.expiresAt && record.expiresAt < new Date())
  ) {
    throw new OAuthError("invalid_grant", "Refresh token is invalid or expired");
  }
  const payload = record.payload as {
    clientId: string;
    teamId: string;
    userId: string;
    scope: string;
  };
  if (payload.clientId !== clientId) {
    throw new OAuthError("invalid_grant", "Refresh token belongs to another client");
  }

  const member = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: { userId: payload.userId, teamId: payload.teamId },
    },
    select: { userId: true },
  });
  if (!member) throw new OAuthError("invalid_grant", "No longer a member of that workspace");

  const client = await findClient(clientId);
  if (!client) throw new OAuthError("invalid_client", "Unknown client", 401);

  // Rotate: the old refresh token is used up.
  await prisma.oAuthRecord.update({
    where: { id },
    data: { consumedAt: new Date() },
  });

  return mintTokens({
    clientRowId: client.id,
    clientName: client.clientName,
    clientId: client.clientId,
    teamId: payload.teamId,
    userId: payload.userId,
    scope: payload.scope,
  });
}

export async function revokeToken(token: string | undefined) {
  if (!token) return;
  await prisma.restrictedToken
    .deleteMany({ where: { hashedKey: hashToken(token), source: "oauth" } })
    .catch(() => {});
  await prisma.oAuthRecord
    .updateMany({
      where: { id: hashToken(`refresh:${token}`), consumedAt: null },
      data: { consumedAt: new Date() },
    })
    .catch(() => {});
}
