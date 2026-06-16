import { describe, it, expect } from 'vitest';
import { contentHash, dedupeByHash } from '@/lib/rss/dedupe';

describe('contentHash', () => {
  it('is deterministic', () => {
    const a = contentHash({ title: 't', url: 'u', description: 'd' });
    const b = contentHash({ title: 't', url: 'u', description: 'd' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('ignores trailing/leading whitespace in description', () => {
    const a = contentHash({ title: 't', url: 'u', description: 'd' });
    const b = contentHash({ title: 't', url: 'u', description: '  d  ' });
    expect(a).toBe(b);
  });

  it('differs on different url', () => {
    expect(
      contentHash({ title: 't', url: 'u1', description: 'd' })
    ).not.toBe(contentHash({ title: 't', url: 'u2', description: 'd' }));
  });
});

describe('dedupeByHash', () => {
  it('removes duplicates by hash, keeps first', () => {
    const items = [
      { title: 'A', url: 'a', description: 'x' },
      { title: 'B', url: 'b', description: 'y' },
      { title: 'A', url: 'a', description: 'x' }, // exact duplicate of first
    ];
    const out = dedupeByHash(items);
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('A');
  });
});
