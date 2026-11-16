/**
 * Storage settings for S3-compatible uploads, read from environment
 * variables. One bucket serves every team; there is no per-team region.
 */
export type StorageConfig = {
  bucket: string;
  advancedBucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  distributionHost: string;
  distributionKeyId?: string;
  distributionKeyContents?: string;
  lambdaFunctionName: string;
};

export function getStorageConfig(_storageRegion?: string): StorageConfig {
  const env = process.env;
  const bucket = env.NEXT_PRIVATE_UPLOAD_BUCKET ?? "";
  return {
    bucket,
    advancedBucket: env.NEXT_PRIVATE_ADVANCED_UPLOAD_BUCKET || bucket,
    region: env.NEXT_PRIVATE_UPLOAD_REGION || "us-east-1",
    endpoint: env.NEXT_PRIVATE_UPLOAD_ENDPOINT || undefined,
    accessKeyId: env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY ?? "",
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
