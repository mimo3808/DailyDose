'use client';
import type { ScriptChapter } from '@/types';

export function ChapterList({
  chapters,
  current,
  onSelect,
}: {
  chapters: ScriptChapter[];
  current: number;
  onSelect: (idx: number) => void;
}) {
  const active = chapters.find(c => c.idx === current);

  return (
    <div>
      {/* Current chapter body */}
      {active && (
        <div className="chapter-body">
          <h2>第{active.idx}章 · {active.title}</h2>
          <p>{active.script_text}</p>
          {active.source_refs.length > 0 && (
            <div className="chapter-sources">
              📰 来源：
              {active.source_refs.map((r, i) => (
                <span key={i}>
                  <a href={r.url} target="_blank" rel="noopener">
                    {r.title.length > 30 ? r.title.slice(0, 30) + '…' : r.title}
                  </a>
                  {i < active.source_refs.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chapter list */}
      {chapters.map(c => (
        <div
          key={c.idx}
          onClick={() => onSelect(c.idx)}
          className={`chapter-item${current === c.idx ? ' chapter-item--active' : ''}`}
        >
          <span className="chapter-item__num">{c.idx}.</span>
          <span className="chapter-item__title">{c.title}</span>
          {current === c.idx && <span>🔊</span>}
        </div>
      ))}
    </div>
  );
}
