type Article = { title: string; url: string; description: string; publishedAt: Date | null };

export function estimateChapterCount(targetMinutes: number): number {
  return Math.max(3, Math.min(12, Math.round(targetMinutes / 2)));
}

export function buildPrompt(args: { date: string; targetMinutes: number; articles: Article[] }): string {
  const chapters = estimateChapterCount(args.targetMinutes);
  const targetChars = Math.round(args.targetMinutes * 200);
  const articleBlock = args.articles
    .map((a, i) => `[${i + 1}] ${a.title}\nURL: ${a.url}\n摘要: ${a.description.slice(0, 400)}`)
    .join('\n\n');
  return `你是一个每日新闻简报的播音稿撰写员。

日期：${args.date}
目标时长：${args.targetMinutes} 分钟（≈ ${targetChars} 中文字符）
目标章节数：${chapters}

候选文章：
${articleBlock}

要求：
- 输出严格的 JSON，不要包含 markdown 代码块
- 按主题/事件分成 ${chapters} 个章节，每章 200-400 字
- 每章引用 1-3 篇文章（用上面 [n] 编号）
- 语言：自然口语化中文，可适度英文术语
- 总字数在 ${Math.round(targetChars * 0.9)} - ${Math.round(targetChars * 1.1)} 之间

JSON schema:
{
  "title": "今日简报标题",
  "chapters": [
    { "idx": 1, "title": "章节标题", "script_text": "正文...", "source_refs": [{"title": "原文章节标题", "url": "..."}] }
  ]
}`;
}
