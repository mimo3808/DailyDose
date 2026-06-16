import { describe, it, expect } from 'vitest';
import { buildPrompt, estimateChapterCount } from '@/lib/briefing/prompt';

const ARTICLES = [
  { title: 'A1', url: 'https://a/1', description: 'desc 1', publishedAt: new Date('2024-01-01') },
  { title: 'A2', url: 'https://a/2', description: 'desc 2', publishedAt: new Date('2024-01-01') },
];

describe('estimateChapterCount', () => {
  it('clamps to [3, 12]', () => {
    expect(estimateChapterCount(2)).toBe(3);
    expect(estimateChapterCount(8)).toBe(4);
    expect(estimateChapterCount(30)).toBe(12);
  });
});

describe('buildPrompt', () => {
  it('contains the date, target minutes, and article URLs', () => {
    const p = buildPrompt({
      date: '2024-01-02',
      targetMinutes: 8,
      articles: ARTICLES,
    });
    expect(p).toContain('2024-01-02');
    expect(p).toContain('8 分钟');
    expect(p).toContain('https://a/1');
    expect(p).toContain('https://a/2');
  });

  it('instructs JSON output', () => {
    const p = buildPrompt({ date: '2024-01-02', targetMinutes: 8, articles: ARTICLES });
    expect(p.toLowerCase()).toContain('json');
  });
});
