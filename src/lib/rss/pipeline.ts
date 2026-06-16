import { neon } from '@neondatabase/serverless';
import { fetchAndStoreForSource, markSourceFailure } from './fetch';

type SourceRow = { id: number; url: string };

export async function runFetchCycle(): Promise<{ ok: number; failed: number }> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql.query(
    `SELECT id, url FROM sources WHERE status IN ('active', 'degraded', 'pending')`
  )) as SourceRow[];

  let ok = 0, failed = 0;
  for (const s of rows) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(s.url, { signal: ctrl.signal, headers: { 'user-agent': 'DayilyDose/0.1' } });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      await fetchAndStoreForSource(s.id, xml);
      ok++;
    } catch (e: any) {
      await markSourceFailure(s.id);
      failed++;
    }
  }
  return { ok, failed };
}
