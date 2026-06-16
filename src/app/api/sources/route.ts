import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sql = getSql();
  const topics = (await sql.query(
    `SELECT id, slug, name_zh FROM topics ORDER BY id`
  )) as { id: number; slug: string; name_zh: string }[];
  const counts = (await sql.query(
    `SELECT topic_id, COUNT(*)::int AS n FROM sources WHERE status = 'active' GROUP BY topic_id`
  )) as { topic_id: number; n: number }[];
  const countMap = new Map(counts.map(c => [c.topic_id, c.n]));
  return NextResponse.json(
    topics.map(t => ({ ...t, active_source_count: countMap.get(t.id) ?? 0 }))
  );
}
