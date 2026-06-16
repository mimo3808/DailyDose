import { describe, it, expect, afterAll } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const TEST_DEVICE = `test-device-${Date.now()}`;

describe('user_prefs CRUD', () => {
  afterAll(async () => {
    await sql.query(`DELETE FROM user_prefs WHERE device_id = $1`, [TEST_DEVICE]);
  });

  it('inserts prefs', async () => {
    await sql.query(
      `INSERT INTO user_prefs (device_id, topic_ids, length_minutes, language)
       VALUES ($1, $2::jsonb, 10, 'zh')`,
      [TEST_DEVICE, JSON.stringify([1, 2, 3])]
    );
    const rows = await sql.query(`SELECT length_minutes FROM user_prefs WHERE device_id = $1`, [TEST_DEVICE]);
    expect((rows[0] as any).length_minutes).toBe(10);
  });

  it('updates prefs', async () => {
    await sql.query(
      `UPDATE user_prefs SET length_minutes = 15 WHERE device_id = $1`,
      [TEST_DEVICE]
    );
    const rows = await sql.query(`SELECT length_minutes FROM user_prefs WHERE device_id = $1`, [TEST_DEVICE]);
    expect((rows[0] as any).length_minutes).toBe(15);
  });
});
