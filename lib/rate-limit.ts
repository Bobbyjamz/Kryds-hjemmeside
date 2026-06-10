import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
});

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Fixed-window rate limiter via Upstash Redis.
 * Bruges fx på /api/admin/login mod brute-force.
 *
 * @param key      unik nøgle (fx "login:" + ip)
 * @param limit    maks antal kald i vinduet
 * @param windowSec vinduets størrelse i sekunder
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }
    const ttl = await redis.ttl(redisKey);
    const remaining = Math.max(0, limit - count);
    return {
      ok: count <= limit,
      remaining,
      resetIn: ttl > 0 ? ttl : windowSec,
    };
  } catch (err) {
    console.error("[rate-limit] Redis fejl — tillader request:", err);
    return { ok: true, remaining: limit, resetIn: windowSec };
  }
}

/** Henter klient-IP fra Next.js request (Vercel-edge headers). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
