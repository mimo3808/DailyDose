import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    neonConfig.fetchConnectionCache = true;
    sql = neon(url);
  }
  return sql;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const s = getSql();
  return s(text, params) as Promise<T[]>;
}
