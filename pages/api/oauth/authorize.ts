import type { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import {
  createAuthorizationCode,
  findClient,
  normaliseScope,
} from "@/community/features/oauth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

/**
 * The consent screen posts here. Returns the URL to send the browser back
 * to the client with, carrying either a code or an error.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Not signed in" });
  const userId = (session.user as CustomUser).id;

  const {
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
    scope,
    teamId,
    decision,
  } = req.body as Record<string, string | undefined>;

  const client = await findClient(client_id);
  if (!client || !redirect_uri || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: "Unknown app or return address" });
  }

  const back = new URL(redirect_uri);
  if (state) back.searchParams.set("state", state);

  if (decision !== "allow") {
    back.searchParams.set("error", "access_denied");
    return res.status(200).json({ redirectTo: back.toString() });
  }

  if (!code_challenge || (code_challenge_method ?? "S256") !== "S256") {
    return res.status(400).json({ error: "PKCE (S256) is required" });
  }
  if (!teamId) return res.status(400).json({ error: "Pick a workspace" });

  const member = await prisma.userTeam.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { userId: true },
  });
  if (!member) return res.status(403).json({ error: "Not in that workspace" });

  const code = await createAuthorizationCode({
    clientId: client.clientId,
    redirectUri: redirect_uri,
    codeChallenge: code_challenge,
    scope: normaliseScope(scope),
    teamId,
    userId,
  });
  back.searchParams.set("code", code);
  return res.status(200).json({ redirectTo: back.toString() });
}
