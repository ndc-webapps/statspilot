/**
 * Minimal in-memory fixed-window rate limiter.
 * Good enough for a single Vercel instance / low volume; swap for Upstash Redis
 * (or similar shared store) if running multiple regions/instances.
 */

const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, max = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > max) return true;
  return false;
}
