import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { extractRssLinksFromHtml } from '../src/lib/rss/discover';

config({ path: resolve(process.cwd(), '.env.local') });

const CANDIDATES = [
  // User-curated list of candidate homepages. Pull from public RSS aggregator
  // pages, blogrolls, and known publication sites. The exact set is up to the
  // user — start with ~20-30 well-known sites; the discoverer will find their
  // own feed links.
  'https://news.ycombinator.com/',
  'https://lobste.rs/',
  'https://www.theverge.com/',
  'https://www.wired.com/',
  'https://arstechnica.com/',
  'https://www.engadget.com/',
  'https://www.zdnet.com/',
  'https://www.technologyreview.com/',
  'https://stratechery.com/',
  'https://www.benkuhn.net/',
  'https://danluu.com/',
  'https://www.greaterwrong.com/',
  'https://www.lesswrong.com/',
  'https://www.economist.com/',
  'https://www.theatlantic.com/',
  'https://www.newyorker.com/',
  'https://www.nytimes.com/',
  'https://www.washingtonpost.com/',
  'https://www.theguardian.com/',
  'https://www.bbc.com/',
];

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const existing = new Set(
    ((await sql.query(`SELECT url FROM sources`)) as any[]).map(r => r.url)
  );
  let added = 0;
  for (const home of CANDIDATES) {
    try {
      const res = await fetch(home, { headers: { 'user-agent': 'DayilyDose/0.1 (+https://dayilydose.app)' } });
      if (!res.ok) continue;
      const html = await res.text();
      const feeds = extractRssLinksFromHtml(html, home);
      for (const url of feeds) {
        if (existing.has(url)) continue;
        await sql.query(
          `INSERT INTO sources (url, title, status) VALUES ($1, NULL, 'pending')`,
          [url]
        );
        added++;
        existing.add(url);
      }
    } catch (e: any) {
      console.warn(`skip ${home}: ${e.message}`);
    }
  }
  console.log(`added ${added} candidate sources`);
}

main().catch(e => { console.error(e); process.exit(1); });
