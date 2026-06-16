import { XMLParser } from 'fast-xml-parser';

export type ParsedItem = {
  title: string;
  url: string;
  description: string;
  publishedAt: Date | null;
};

export type ParsedFeed = {
  channelTitle: string;
  items: ParsedItem[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
});

function pickChannelTitle(parsed: any): string {
  return parsed?.rss?.channel?.title ?? parsed?.feed?.title ?? '';
}

function pickItems(parsed: any): any[] {
  const rss = parsed?.rss?.channel?.item;
  const atom = parsed?.feed?.entry;
  const arr = Array.isArray(rss) ? rss : rss ? [rss] : [];
  if (arr.length) return arr;
  const aArr = Array.isArray(atom) ? atom : atom ? [atom] : [];
  return aArr;
}

function pickUrl(item: any): string {
  if (typeof item.link === 'string') return item.link;
  if (Array.isArray(item.link)) {
    const alt = item.link.find((l: any) => l['@_rel'] === 'alternate') ?? item.link[0];
    return alt?.['@_href'] ?? '';
  }
  if (item.link?.['@_href']) return item.link['@_href'];
  return '';
}

function pickDate(item: any): Date | null {
  const raw = item.pubDate ?? item.published ?? item.updated;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function parseRssXml(xml: string): ParsedFeed {
  try {
    const parsed = parser.parse(xml);
    const channelTitle = pickChannelTitle(parsed);
    const items = pickItems(parsed).map((it: any) => ({
      title: String(it.title ?? '').trim(),
      url: pickUrl(it),
      description: String(it.description ?? it.summary ?? it['content:encoded'] ?? '').trim(),
      publishedAt: pickDate(it),
    })).filter(i => i.title && i.url);
    return { channelTitle, items };
  } catch {
    return { channelTitle: '', items: [] };
  }
}
