import type { NextApiRequest, NextApiResponse } from "next";

import { randomBytes } from "crypto";

import { isAllowedRedirectUri } from "@/community/features/oauth";
import { bodyParams, cors } from "@/community/features/oauth/http";
import { ratelimit } from "@/lib/redis";
import prisma from "@/lib/prisma";

/** RFC 7591 dynamic client registration (public clients only). */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0] ??
    "unknown";
  try {
    const { success } = await ratelimit(20, "1 h").limit(`oauth-register:${ip}`);
    if (!success) {
      return res.status(429).json({ error: "too_many_requests" });
    }
  } catch {
    // rate limiter unavailable: carry on
  }

  const body = bodyParams(req) as unknown as {
    client_name?: string;
    client_uri?: string;
    logo_uri?: string;
    redirect_uris?: string[];
  };
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
  if (redirectUris.length === 0 || !redirectUris.every(isAllowedRedirectUri)) {
    return res.status(400).json({
      error: "invalid_redirect_uri",
      error_description: "Give at least one valid redirect_uri",
    });
  }

  const clientId = `dyn_${randomBytes(16).toString("hex")}`;
  const client = await prisma.oAuthClient.create({
    data: {
      clientId,
      clientName: (body.client_name || "MCP client").slice(0, 100),
      clientUri: body.client_uri?.slice(0, 500) || null,
      logoUri: body.logo_uri?.slice(0, 500) || null,
      redirectUris,
      grantTypes: ["authorization_code", "refresh_token"],
      scopes: "apis.all apis.read",
      tokenAuthMethod: "none",
      registrationType: "dynamic",
    },
  });

  return res.status(201).json({
    client_id: client.clientId,
    client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
    client_name: client.clientName,
    redirect_uris: client.redirectUris,
    grant_types: client.grantTypes,
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: "apis.all apis.read",
  });
}
