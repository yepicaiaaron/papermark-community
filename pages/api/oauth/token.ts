import type { NextApiRequest, NextApiResponse } from "next";

import {
  OAuthError,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
} from "@/community/features/oauth";
import { bodyParams, cors } from "@/community/features/oauth/http";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const p = bodyParams(req);
  try {
    if (p.grant_type === "authorization_code") {
      const tokens = await exchangeAuthorizationCode({
        code: p.code,
        clientId: p.client_id,
        redirectUri: p.redirect_uri,
        codeVerifier: p.code_verifier,
      });
      return res.status(200).json(tokens);
    }
    if (p.grant_type === "refresh_token") {
      const tokens = await exchangeRefreshToken({
        refreshToken: p.refresh_token,
        clientId: p.client_id,
      });
      return res.status(200).json(tokens);
    }
    return res.status(400).json({ error: "unsupported_grant_type" });
  } catch (error) {
    if (error instanceof OAuthError) {
      return res
        .status(error.status)
        .json({ error: error.code, error_description: error.message });
    }
    console.error("[oauth] token error", error);
    return res.status(500).json({ error: "server_error" });
  }
}
