import { describe, it, expect } from 'vitest';
import { extractRssLinksFromHtml } from '@/lib/rss/discover';

const HTML = `
<html><head>
  <link rel="alternate" type="application/rss+xml" title="RSS" href="/feed.xml"/>
  <link rel="alternate" type="application/atom+xml" title="Atom" href="/atom.xml"/>
  <link rel="stylesheet" href="/style.css"/>
</head><body></body></html>`;

describe('extractRssLinksFromHtml', () => {
  it('finds RSS and Atom links', () => {
    const links = extractRssLinksFromHtml(HTML, 'https://example.com/');
    expect(links).toContain('https://example.com/feed.xml');
    expect(links).toContain('https://example.com/atom.xml');
  });

  it('ignores non-feed links', () => {
    const links = extractRssLinksFromHtml(HTML, 'https://example.com/');
    expect(links.find(l => l.endsWith('style.css'))).toBeUndefined();
  });

  it('handles absolute URLs', () => {
    const html = `<link rel="alternate" type="application/rss+xml" href="https://other.com/rss"/>`;
    const links = extractRssLinksFromHtml(html, 'https://example.com/');
    expect(links).toContain('https://other.com/rss');
  });
});
