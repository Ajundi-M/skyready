/**
 * In-memory sliding-window rate limiter.
 *
 * COLD-START LIMITATION: In serverless environments (Vercel, AWS Lambda) each
 * function instance starts with a clean in-memory store. A burst of traffic
 * that spans multiple instances (or a cold start mid-window) effectively resets
 * the counter for that instance. This is acceptable for a low-traffic portfolio
 * project where the primary threat is accidental hammering, not a determined
 * attacker. For production use, replace with a persistent store such as Upstash
 * Redis or a Supabase table.
 */

const store = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Approximate ms until the oldest request leaves the window. */
  resetInMs: number;
}

/**
 * Checks whether a key is within the rate limit using a sliding window.
 *
 * @param key        Unique per-action per-client identifier, e.g. `"login:1.2.3.4"`.
 * @param maxRequests Maximum number of requests allowed within the window.
 * @param windowMs   Sliding window length in milliseconds.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    const resetInMs = (timestamps[0] ?? now) + windowMs - now;
    store.set(key, timestamps);
    return { allowed: false, remaining: 0, resetInMs };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return {
    allowed: true,
    remaining: maxRequests - timestamps.length,
    resetInMs: 0,
  };
}
