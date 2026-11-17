import { awsCredentialsProvider } from "@vercel/functions/oidc";

/**
 * Storage settings for S3-compatible uploads, read from environment
 * variables. One bucket serves every team; there is no per-team region.
 *
 * Two ways to authenticate:
 * - static keys: NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID and
 *   NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY (any S3-compatible store), or
 * - Vercel's AWS integration (OIDC): an IAM role ARN in S3_AWS_ROLE_ARN or
 *   AWS_ROLE_ARN. Bucket and region can then come from S3_BUCKET_NAME and
 *   S3_AWS_REGION, which that integration sets.
 */
export type StorageConfig = {
  bucket: string;
  advancedBucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  roleArn?: string;
  distributionHost: string;
  distributionKeyId?: string;
  distributionKeyContents?: string;
  lambdaFunctionName: string;
};

export function getStorageConfig(_storageRegion?: string): StorageConfig {
  const env = process.env;
  const bucket = env.NEXT_PRIVATE_UPLOAD_BUCKET || env.S3_BUCKET_NAME || "";
  return {
    bucket,
    advancedBucket: env.NEXT_PRIVATE_ADVANCED_UPLOAD_BUCKET || bucket,
    region:
      env.NEXT_PRIVATE_UPLOAD_REGION || env.S3_AWS_REGION || "us-east-1",
    endpoint: env.NEXT_PRIVATE_UPLOAD_ENDPOINT || undefined,
    accessKeyId: env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY ?? "",
    roleArn: env.S3_AWS_ROLE_ARN || env.AWS_ROLE_ARN || undefined,
    distributionHost:
      env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN ||
      env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST ||
      "",
    distributionKeyId: env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID || undefined,
    distributionKeyContents:
      env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS || undefined,
    lambdaFunctionName: env.NEXT_PRIVATE_BULK_DOWNLOAD_LAMBDA ?? "",
  };
}

export async function getTeamStorageConfigById(
  _teamId: string,
): Promise<StorageConfig> {
  return getStorageConfig();
}

/**
 * Credentials for AWS SDK clients: static keys when set, otherwise the
 * Vercel OIDC role. Role credentials only work inside Vercel functions, and
 * links signed with them last at most as long as the role session (1 hour).
 */
export function getStorageCredentials(config: StorageConfig) {
  if (config.accessKeyId && config.secretAccessKey) {
    return {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    };
  }
  if (config.roleArn) {
    return awsCredentialsProvider({ roleArn: config.roleArn });
  }
  return {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  };
}
