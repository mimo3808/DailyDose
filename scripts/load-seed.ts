import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import topics from '../db/seed/topics.json';
import sources from '../db/seed/sources.json';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set in .env.local');

const sql = neon(url);

async function main() {
  for (const t of topics) {
    await sql.query(
      `INSERT INTO topics (slug, name_zh, name_en) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name_zh = EXCLUDED.name_zh`,
      [t.slug, t.name_zh, t.name_en ?? null]
    );
  }
  console.log(`loaded ${topics.length} topics`);

  const topicRows = await sql.query<{ id: number; slug: string }>('SELECT id, slug FROM topics');
  const slugToId = new Map(topicRows.map(r => [r.slug, r.id]));

  let count = 0;
  let warned = 0;
  for (const s of sources) {
    let topicId: number | null = null;
    if (s.topic_slug) {
      const id = slugToId.get(s.topic_slug);
      if (id == null) {
        console.warn(`unknown topic_slug "${s.topic_slug}" for source ${s.url}; inserting with topic_id=null`);
        warned++;
      } else {
        topicId = id;
      }
    }
    await sql.query(
      `INSERT INTO sources (url, title, topic_id, language, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (url) DO UPDATE SET title = EXCLUDED.title, topic_id = EXCLUDED.topic_id`,
      [s.url, s.title ?? null, topicId, s.language ?? 'zh']
    );
    count++;
  }
  console.log(`loaded ${count} sources`);
}

main().catch(e => { console.error(e); process.exit(1); });
