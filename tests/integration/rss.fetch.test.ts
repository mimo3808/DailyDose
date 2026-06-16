import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { fetchAndStoreForSource } from '@/lib/rss/fetch';

const sql = neon(process.env.DATABASE_URL!);
let testSourceId: number;

const MOCK_RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
<title>Mock</title>
<item>
  <title>Item 1</title>
  <link>https://mock.test/1</link>
  <description>Body 1</description>
  <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
</item>
</channel></rss>`;

describe('fetchAndStoreForSource', () => {
  beforeAll(async () => {
    const r = await sql.query(
      `INSERT INTO sources (url, title, status) VALUES ($1, 'Mock Test', 'active') RETURNING id`,
      [`https://mock.test/feed-${Date.now()}`]
    );
    testSourceId = (r[0] as any).id;
  });

  afterAll(async () => {
    await sql.query(`DELETE FROM sources WHERE id = $1`, [testSourceId]);
  });

  it('inserts new articles', async () => {
    const inserted = await fetchAndStoreForSource(testSourceId, MOCK_RSS);
    expect(inserted).toBe(1);
  });

  it('does not duplicate on second call', async () => {
    await fetchAndStoreForSource(testSourceId, MOCK_RSS);
    const inserted = await fetchAndStoreForSource(testSourceId, MOCK_RSS);
    expect(inserted).toBe(0);
  });
});
