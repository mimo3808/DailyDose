import { describe, it, expect } from 'vitest';
import { buildExtractiveScript } from '@/lib/briefing/extractive';

const ARTICLES = Array.from({ length: 20 }, (_, i) => ({
  title: `Article ${i}`,
  url: `https://a/${i}`,
  description: `Description for article ${i}.`,
  publishedAt: new Date('2024-01-01'),
}));

describe('buildExtractiveScript', () => {
  it('respects chapter count estimate', () => {
    const out = buildExtractiveScript(ARTICLES, 8); // expect 4 chapters
    expect(out.chapters.length).toBe(4);
  });

  it('returns at least 1 chapter even with few articles', () => {
    const out = buildExtractiveScript(ARTICLES.slice(0, 2), 8);
    expect(out.chapters.length).toBe(1);
  });

  it('truncates long titles', () => {
    const long = [{ title: 'X'.repeat(100), url: 'u', description: 'd', publishedAt: null }];
    const out = buildExtractiveScript(long, 3);
    expect(out.chapters[0].title.endsWith('…')).toBe(true);
  });
});
