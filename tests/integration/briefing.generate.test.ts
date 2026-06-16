import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

vi.mock('@/lib/briefing/llm', () => ({
  generateBriefingScript: vi.fn().mockResolvedValue({
    title: 'Test Brief',
    chapters: [
      { idx: 1, title: 'C1', script_text: 'hello world', source_refs: [{ title: 'a', url: 'https://a' }] },
      { idx: 2, title: 'C2', script_text: 'second', source_refs: [] },
    ],
  }),
}));

import { generateBriefing } from '@/lib/briefing/generator';

const sql = neon(process.env.DATABASE_URL!);
const TEST_DEVICE = `test-device-${Date.now()}`;
let TEST_TOPIC: number;

describe('generateBriefing', () => {
  beforeAll(async () => {
    const r = await sql.query(`INSERT INTO topics (slug, name_zh) VALUES ($1, 'Test Topic') RETURNING id`, [`test-${Date.now()}`]);
    TEST_TOPIC = (r[0] as any).id;
    // Insert a recent article
    await sql.query(
      `INSERT INTO sources (url, topic_id, status) VALUES ($1, $2, 'active')`,
      [`https://test/${Date.now()}`, TEST_TOPIC]
    );
    const src = (await sql.query(`SELECT id FROM sources WHERE topic_id = $1 ORDER BY id DESC LIMIT 1`, [TEST_TOPIC]))[0] as any;
    await sql.query(
      `INSERT INTO articles (source_id, topic_id, title, url, content, published_at, content_hash)
       VALUES ($1, $2, 'Test Article', 'https://test/a', 'desc', NOW() - INTERVAL '1 hour', $3)`,
      [src.id, TEST_TOPIC, `hash-${Date.now()}`]
    );
  });

  afterAll(async () => {
    await sql.query(`DELETE FROM articles WHERE topic_id = $1`, [TEST_TOPIC]);
    await sql.query(`DELETE FROM sources WHERE topic_id = $1`, [TEST_TOPIC]);
    await sql.query(`DELETE FROM briefings WHERE device_id = $1`, [TEST_DEVICE]);
    await sql.query(`DELETE FROM daily_cache WHERE device_id = $1`, [TEST_DEVICE]);
    await sql.query(`DELETE FROM topics WHERE id = $1`, [TEST_TOPIC]);
  });

  it('returns a script and writes to DB', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const script = await generateBriefing({
      device_id: TEST_DEVICE,
      date,
      length_minutes: 8,
      topic_ids: [TEST_TOPIC],
    });
    expect(script.title).toBe('Test Brief');
    expect(script.chapters.length).toBe(2);
  });

  it('serves from daily_cache on second call', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const script = await generateBriefing({
      device_id: TEST_DEVICE,
      date,
      length_minutes: 8,
      topic_ids: [TEST_TOPIC],
    });
    expect(script.title).toBe('Test Brief');
  });

  it('returns 422-equivalent error on no articles', async () => {
    const date = '1999-01-01';
    try {
      await generateBriefing({
        device_id: TEST_DEVICE,
        date,
        length_minutes: 8,
        topic_ids: [TEST_TOPIC],
      });
      expect.fail('expected throw');
    } catch (e: any) {
      expect(e.status).toBe(422);
    }
  });
});
