import type { ScriptJson } from '@/types';
import { estimateChapterCount } from './prompt';

type Article = { title: string; url: string; description: string; publishedAt: Date | null };

export function buildExtractiveScript(articles: Article[], lengthMinutes: number): ScriptJson {
  const targetChapters = estimateChapterCount(lengthMinutes);
  const effectiveChapters = articles.length < targetChapters ? 1 : targetChapters;
  const perChapter = Math.max(1, Math.ceil(articles.length / effectiveChapters));
  const chapters = [];
  for (let i = 0; i < effectiveChapters; i++) {
    const slice = articles.slice(i * perChapter, (i + 1) * perChapter);
    if (!slice.length) break;
    const titles = slice.map(a => a.title).join('、');
    const body = slice
      .map(a => a.description.slice(0, 200))
      .filter(Boolean)
      .join(' ');
    chapters.push({
      idx: i + 1,
      title: titles.length > 30 ? titles.slice(0, 30) + '…' : titles,
      script_text: body || titles,
      source_refs: slice.map(a => ({ title: a.title, url: a.url })),
    });
  }
  return { title: '今日新闻速览', chapters };
}
