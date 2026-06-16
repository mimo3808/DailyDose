import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const topics = await query<{ id: number; slug: string; name_zh: string }>(
    `SELECT id, slug, name_zh FROM topics ORDER BY id`
  );
  const counts = await query<{ topic_id: number; n: number }>(
    `SELECT topic_id, COUNT(*)::int AS n FROM sources WHERE status = 'active' GROUP BY topic_id`
  );
  const countMap = new Map(counts.map(c => [c.topic_id, c.n]));
  return NextResponse.json(
    topics.map(t => ({ ...t, active_source_count: countMap.get(t.id) ?? 0 }))
  );
}
