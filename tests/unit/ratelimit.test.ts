import { describe, it, expect } from 'vitest';
import { tokenBucket } from '@/lib/ratelimit';

describe('tokenBucket', () => {
  it('allows up to capacity in window', () => {
    const bucket = tokenBucket({ capacity: 3, refillPerSec: 0 });
    expect(bucket.tryConsume('ip-1')).toBe(true);
    expect(bucket.tryConsume('ip-1')).toBe(true);
    expect(bucket.tryConsume('ip-1')).toBe(true);
    expect(bucket.tryConsume('ip-1')).toBe(false);
  });

  it('isolates keys', () => {
    const bucket = tokenBucket({ capacity: 1, refillPerSec: 0 });
    expect(bucket.tryConsume('a')).toBe(true);
    expect(bucket.tryConsume('a')).toBe(false);
    expect(bucket.tryConsume('b')).toBe(true);
  });
});
