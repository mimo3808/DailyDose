import { describe, it, expect } from 'vitest';
import { parseRssXml } from '@/lib/rss/parse';

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Hello World</title>
      <link>https://example.com/a</link>
      <description>First post</description>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second</title>
      <link>https://example.com/b</link>
      <description>Second post body</description>
      <pubDate>Tue, 02 Jan 2024 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe('parseRssXml', () => {
  it('extracts channel title', () => {
    const r = parseRssXml(SAMPLE);
    expect(r.channelTitle).toBe('Test Feed');
  });

  it('extracts all items with required fields', () => {
    const r = parseRssXml(SAMPLE);
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({
      title: 'Hello World',
      url: 'https://example.com/a',
      description: 'First post',
    });
    expect(r.items[0].publishedAt).toBeInstanceOf(Date);
  });

  it('handles Atom feed', () => {
    const atom = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Atom</title>
        <entry>
          <title>Atom Item</title>
          <link href="https://example.com/x"/>
          <summary>Atom desc</summary>
          <updated>2024-01-03T10:00:00Z</updated>
        </entry>
      </feed>`;
    const r = parseRssXml(atom);
    expect(r.channelTitle).toBe('Atom');
    expect(r.items).toHaveLength(1);
    expect(r.items[0].url).toBe('https://example.com/x');
  });

  it('returns empty on invalid XML', () => {
    const r = parseRssXml('not xml');
    expect(r.channelTitle).toBe('');
    expect(r.items).toEqual([]);
  });
});
