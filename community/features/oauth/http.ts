import type { NextApiRequest, NextApiResponse } from "next";

/** Shared bits for the community OAuth API routes. */
export function cors(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

/** Token requests are form encoded; accept JSON too. */
export function bodyParams(req: NextApiRequest): Record<string, string> {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return Object.fromEntries(new URLSearchParams(body));
    }
  }
  return body as Record<string, string>;
}
