interface RateLimitStore {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitStore>();

// Clean up expired items every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of cache.entries()) {
      if (val.resetAt < now) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  // In development, allow generous limit for local testing
  const effectiveLimit = process.env.NODE_ENV === 'development' ? Math.max(limit, 50) : limit;
  const now = Date.now();
  const record = cache.get(identifier);

  if (!record || record.resetAt < now) {
    cache.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    });
    return { success: true, remaining: effectiveLimit - 1, reset: now + windowMs };
  }

  if (record.count >= effectiveLimit) {
    return { success: false, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: effectiveLimit - record.count, reset: record.resetAt };
}
