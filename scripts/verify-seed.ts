import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set in .env.local');

const sql = neon(url);

async function main() {
  const topics = await sql.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM topics');
  const sources = await sql.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM sources');
  const byTopic = await sql.query<{ slug: string; n: number }>(
    'SELECT t.slug, COUNT(s.id)::int AS n FROM topics t LEFT JOIN sources s ON s.topic_id = t.id GROUP BY t.slug ORDER BY t.slug'
  );
  console.log(`topics: ${topics[0].n}`);
  console.log(`sources: ${sources[0].n}`);
  for (const r of byTopic) {
    console.log(`  ${r.slug}: ${r.n}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
