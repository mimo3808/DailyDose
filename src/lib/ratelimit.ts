type Bucket = { tokens: number; updatedAt: number };
type Options = { capacity: number; refillPerSec: number };

export function tokenBucket(opts: Options) {
  const buckets = new Map<string, Bucket>();
  return {
    tryConsume(key: string, cost = 1): boolean {
      const now = Date.now();
      const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
      const elapsed = (now - b.updatedAt) / 1000;
      b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
      b.updatedAt = now;
      if (b.tokens >= cost) {
        b.tokens -= cost;
        buckets.set(key, b);
        return true;
      }
      buckets.set(key, b);
      return false;
    },
  };
}
