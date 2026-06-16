import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set in .env.local');

const sql = neon(url);

const ddl = readFileSync(resolve(process.cwd(), 'db/schema.sql'), 'utf8');

// Split on `;\n` boundaries; strip line comments; drop empty chunks.
const statements = ddl
  .split(/;\s*\n/)
  .map(s => s.replace(/^--.*$/gm, '').trim())
  .filter(s => s.length > 0);

async function main() {
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`schema applied: ${statements.length} statements`);
}

main().catch(e => { console.error(e); process.exit(1); });
