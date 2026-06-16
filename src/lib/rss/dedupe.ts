import { createHash } from 'crypto';

export type Hashable = { title: string; url: string; description: string };

export function contentHash(item: Hashable): string {
  const desc = (item.description ?? '').slice(0, 500).trim();
  const seed = [item.title.trim(), item.url.trim(), desc].join('|');
  return createHash('sha256').update(seed).digest('hex');
}

export function dedupeByHash<T extends Hashable>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const h = contentHash(it);
    if (seen.has(h)) continue;
    seen.add(h);
    out.push(it);
  }
  return out;
}
