import { neon } from '@neondatabase/serverless';
import { parseRssXml } from './parse';
import { contentHash, dedupeByHash } from './dedupe';

export async function fetchAndStoreForSource(sourceId: number, rawXml: string): Promise<number> {
  const sql = neon(process.env.DATABASE_URL!);
  const sourceRows = await sql.query(`SELECT topic_id, url FROM sources WHERE id = $1`, [sourceId]);
  if (!sourceRows.length) return 0;
  const topicId = (sourceRows[0] as any).topic_id;

  const { items } = parseRssXml(rawXml);
  if (!items.length) return 0;

  const unique = dedupeByHash(items);
  let inserted = 0;
  for (const it of unique) {
    const hash = contentHash(it);
    const r = await sql.query(
      `INSERT INTO articles (source_id, topic_id, title, url, content, published_at, content_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (content_hash) DO NOTHING
       RETURNING id`,
      [sourceId, topicId, it.title, it.url, it.description, it.publishedAt?.toISOString() ?? null, hash]
    );
    if (r.length) inserted++;
  }

  await sql.query(
    `UPDATE sources SET last_fetched_at = NOW(), consecutive_failures = 0, status = 'active' WHERE id = $1`,
    [sourceId]
  );
  return inserted;
}

export async function markSourceFailure(sourceId: number): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql.query(
    `UPDATE sources
     SET consecutive_failures = consecutive_failures + 1,
         status = CASE WHEN consecutive_failures + 1 >= 5 THEN 'inactive' ELSE 'degraded' END
     WHERE id = $1
     RETURNING status, consecutive_failures`,
    [sourceId]
  );
  if (!rows.length) return;
  const r = rows[0] as any;
  if (r.status === 'inactive') {
    console.warn(`source ${sourceId} marked inactive after ${r.consecutive_failures} failures`);
  }
}
