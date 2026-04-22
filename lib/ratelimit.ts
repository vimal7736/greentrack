import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Sliding window rate limiting using Upstash Redis.
 * Gracefully degrades (allows request) if credentials are missing.
 */

const redis = 
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = redis ? {
  ocr: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/ocr",
  }),
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/checkout",
  }),
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/upload",
  }),
} : null;

export async function checkRateLimit(
  limiterName: "ocr" | "checkout" | "upload",
  identifier: string
) {
  if (!limiters) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const limiter = limiters[limiterName];
  return await limiter.limit(identifier);
}
