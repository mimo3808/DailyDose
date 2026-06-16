import { query } from '@/lib/db';
import { parseRssXml } from './parse';
import { contentHash, dedupeByHash } from './dedupe';

export async function fetchAndStoreForSource(sourceId: number, rawXml: string): Promise<number> {
  const sourceRows = await query<{ topic_id: number | null; url: string }>(
    `SELECT topic_id, url FROM sources WHERE id = $1`, [sourceId]
  );
  if (!sourceRows.length) return 0;
  const topicId = sourceRows[0].topic_id;

  const { items } = parseRssXml(rawXml);
  if (!items.length) return 0;

  const unique = dedupeByHash(items);
  let inserted = 0;
  for (const it of unique) {
    const hash = contentHash(it);
    const r = await query<{ id: number }>(
      `INSERT INTO articles (source_id, topic_id, title, url, content, published_at, content_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (content_hash) DO NOTHING
       RETURNING id`,
      [sourceId, topicId, it.title, it.url, it.description, it.publishedAt?.toISOString() ?? null, hash]
    );
    if (r.length) inserted++;
  }

  await query(
    `UPDATE sources SET last_fetched_at = NOW(), consecutive_failures = 0, status = 'active' WHERE id = $1`,
    [sourceId]
  );
  return inserted;
}

export async function markSourceFailure(sourceId: number): Promise<void> {
  const rows = await query<{ status: string; consecutive_failures: number }>(
    `UPDATE sources
     SET consecutive_failures = consecutive_failures + 1,
         status = CASE WHEN consecutive_failures + 1 >= 5 THEN 'inactive' ELSE 'degraded' END
     WHERE id = $1
     RETURNING status, consecutive_failures`,
    [sourceId]
  );
  if (!rows.length) return;
  const r = rows[0];
  if (r.status === 'inactive') {
    console.warn(`source ${sourceId} marked inactive after ${r.consecutive_failures} failures`);
  }
}
