export function extractRssLinksFromHtml(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const re = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    if (!/type=["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    try {
      links.push(new URL(hrefMatch[1], baseUrl).toString());
    } catch {
      // ignore malformed
    }
  }
  return Array.from(new Set(links));
}
