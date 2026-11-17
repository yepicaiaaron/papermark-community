import { S3Store } from "@tus/s3-store";

import { getStorageConfig, getStorageCredentials } from "./config";

/**
 * Resumable upload store. The community edition uses one bucket, so this
 * is the standard tus S3 store pointed at the configured bucket.
 */
export class MultiRegionS3Store extends S3Store {
  constructor() {
    const config = getStorageConfig();
    super({
      partSize: 8 * 1024 * 1024,
      s3ClientConfig: {
        bucket: config.bucket,
        region: config.region,
        endpoint: config.endpoint,
        credentials: getStorageCredentials(config),
      },
    });
  }
}
