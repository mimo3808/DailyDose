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
        <div style={{
          background: '#f8f9fa', borderRadius: 16, padding: '20px 24px',
          marginBottom: 20, lineHeight: 1.85, fontSize: 17,
          borderLeft: '4px solid var(--accent)',
        }}>
          <h2 style={{ fontSize: 20, margin: '0 0 12px', fontWeight: 600 }}>
            第{active.idx}章 · {active.title}
          </h2>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {active.script_text}
          </p>
          {active.source_refs.length > 0 && (
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)', borderTop: '1px solid #ddd', paddingTop: 12 }}>
              📰 来源：
              {active.source_refs.map((r, i) => (
                <span key={i}>
                  <a href={r.url} target="_blank" rel="noopener" style={{ color: 'var(--accent)', marginLeft: 4 }}>
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
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {chapters.map(c => (
          <li
            key={c.idx}
            onClick={() => onSelect(c.idx)}
            style={{
              padding: '10px 16px',
              marginBottom: 6,
              borderRadius: 10,
              background: current === c.idx ? 'var(--accent)' : '#f5f5f5',
              color: current === c.idx ? '#fff' : 'var(--fg)',
              cursor: 'pointer',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontWeight: 600, minWidth: 24 }}>{c.idx}.</span>
            <span style={{ flex: 1 }}>{c.title}</span>
            {current === c.idx && <span style={{ fontSize: 12 }}>🔊</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
