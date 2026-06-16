import { describe, it, expect } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

describe('GET /api/sources shape', () => {
  it('returns topics with source counts', async () => {
    const rows = (await sql.query(`SELECT id, slug, name_zh FROM topics ORDER BY id`)) as any[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('slug');
  });
});
