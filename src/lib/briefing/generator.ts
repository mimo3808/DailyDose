import { query } from '@/lib/db';
import { buildPrompt, estimateChapterCount } from './prompt';
import { generateBriefingScript } from './llm';
import { buildExtractiveScript } from './extractive';
import type { ScriptJson } from '@/types';

type Args = { device_id: string; date: string; length_minutes: number; topic_ids: number[] };

export async function generateBriefing(args: Args): Promise<ScriptJson> {
  const { device_id, date, length_minutes, topic_ids } = args;

  // Check daily_cache first
  const cached = await query<{ briefing_id: number }>(
    `SELECT briefing_id FROM daily_cache WHERE device_id = $1 AND brief_date = $2`,
    [device_id, date]
  );
  if (cached.length) {
    const rows = await query<{ script_json: ScriptJson }>(
      `SELECT script_json FROM briefings WHERE id = $1`,
      [cached[0].briefing_id]
    );
    if (rows.length) return rows[0].script_json;
  }

  // Fetch articles for the user's topics within the date ± 12h window
  const articles = await query<{
    title: string; url: string; content: string | null; published_at: string;
  }>(
    `SELECT title, url, content, published_at FROM articles
     WHERE topic_id = ANY($1::int[])
       AND published_at >= $2::date - INTERVAL '12 hours'
       AND published_at <  $2::date + INTERVAL '36 hours'
     ORDER BY published_at DESC NULLS LAST
     LIMIT 60`,
    [topic_ids, date]
  );

  if (!articles.length) {
    const err: any = new Error('no_articles');
    err.status = 422;
    throw err;
  }

  const promptArticles = articles.map(a => ({
    title: a.title,
    url: a.url,
    description: a.content ?? '',
    publishedAt: a.published_at ? new Date(a.published_at) : null,
  }));

  // Try LLM; on failure, fall back to extractive
  let script: ScriptJson;
  try {
    const prompt = buildPrompt({ date, targetMinutes: length_minutes, articles: promptArticles });
    script = await generateBriefingScript(prompt);
    // Defensive: clamp chapter count to estimate
    const max = estimateChapterCount(length_minutes) + 2;
    script.chapters = script.chapters.slice(0, max);
  } catch (e) {
    console.warn('LLM failed, falling back to extractive:', e);
    script = buildExtractiveScript(promptArticles, length_minutes);
  }

  // Persist
  const inserted = await query<{ id: number }>(
    `INSERT INTO briefings (device_id, brief_date, target_minutes, script_json)
     VALUES ($1, $2::date, $3, $4::jsonb) RETURNING id`,
    [device_id, date, length_minutes, JSON.stringify(script)]
  );
  const briefingId = inserted[0].id;
  await query(
    `INSERT INTO daily_cache (device_id, brief_date, briefing_id) VALUES ($1, $2::date, $3)
     ON CONFLICT (device_id, brief_date) DO UPDATE SET briefing_id = EXCLUDED.briefing_id`,
    [device_id, date, briefingId]
  );

  return script;
}

export async function clearDailyCache(deviceId: string, date: string): Promise<void> {
  // Delete the briefing row first (FK from daily_cache is ON DELETE SET NULL? No — just delete both)
  const cached = await query<{ briefing_id: number }>(
    `DELETE FROM daily_cache WHERE device_id = $1 AND brief_date = $2::date RETURNING briefing_id`,
    [deviceId, date]
  );
  for (const row of cached) {
    await query(`DELETE FROM briefings WHERE id = $1`, [row.briefing_id]);
  }
}
