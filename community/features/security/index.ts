import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/redis";

const limiter = (
  requests: number,
  window: `${number} ${"s" | "m" | "h"}`,
  prefix: string,
) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `community:${prefix}`,
  });

export const rateLimiters = {
  auth: limiter(10, "1 m", "auth"),
  domainVerification: limiter(20, "1 h", "domain-verify"),
  bulkLinkImport: limiter(5, "1 h", "bulk-link-import"),
};

/**
 * Fails open if Redis is not configured, so a missing Upstash account
 * never locks anyone out.
 */
export async function checkRateLimit(limiter: Ratelimit, key: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return { success: true, remaining: Infinity, limit: Infinity, reset: 0 };
  }
  try {
    const { success, remaining, limit, reset } = await limiter.limit(key);
    return { success, remaining, limit, reset };
  } catch {
    return { success: true, remaining: 0, limit: 0, reset: 0 };
  }
}
