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
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {chapters.map(c => (
        <li
          key={c.idx}
          onClick={() => onSelect(c.idx)}
          style={{
            padding: '12px 16px',
            marginBottom: 8,
            borderRadius: 12,
            background: current === c.idx ? 'var(--accent)' : '#f5f5f5',
            color: current === c.idx ? '#fff' : 'var(--fg)',
            cursor: 'pointer',
          }}
        >
          <strong>{c.idx}. {c.title}</strong>
          {c.source_refs.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              来源：{c.source_refs.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener"
                  style={{ color: 'inherit', textDecoration: 'underline', marginRight: 6 }}
                  onClick={e => e.stopPropagation()}
                >
                  {r.title.length > 20 ? r.title.slice(0, 20) + '…' : r.title}
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
