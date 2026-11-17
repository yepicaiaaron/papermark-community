import { NextApiRequest, NextApiResponse } from "next";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "node:path";

import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import { safeSlugify } from "@/lib/utils";

/**
 * Internal: gives a background task a short-lived upload link for one file.
 *
 * Community edition. Background tasks run on Trigger.dev, outside Vercel,
 * so when storage uses Vercel's AWS role (OIDC) they have no credentials of
 * their own. They ask the app for a presigned PUT URL instead.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!process.env.INTERNAL_API_KEY || token !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId, docId, fileName, contentType } = req.body as {
    teamId?: string;
    docId?: string;
    fileName?: string;
    contentType?: string;
  };
  if (!teamId || !docId || !fileName || contentType !== "application/pdf") {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { name, ext } = path.parse(fileName);
  const key = `${teamId}/${docId}/${safeSlugify(name)}${ext}`;
  const { client, config } = await getTeamS3ClientAndConfig(teamId);

  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 15 * 60 },
  );

  return res.status(200).json({ url, key });
}
