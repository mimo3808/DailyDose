'use client';
import { useEffect, useState } from 'react';

type Topic = { id: number; slug: string; name_zh: string; active_source_count: number };

export function TopicPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sources')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setTopics)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <p style={{ color: 'red' }}>加载 topic 失败：{err}</p>;
  if (!topics.length) return <p>加载中…</p>;

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };

  return (
    <div>
      <h3>选择你关心的行业</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            disabled={t.active_source_count === 0}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              border: '1px solid #ccc',
              background: value.includes(t.id) ? 'var(--accent)' : '#fff',
              color: value.includes(t.id) ? '#fff' : 'var(--fg)',
              cursor: t.active_source_count === 0 ? 'not-allowed' : 'pointer',
              opacity: t.active_source_count === 0 ? 0.5 : 1,
            }}
          >
            {t.name_zh} <small>({t.active_source_count})</small>
          </button>
        ))}
      </div>
    </div>
  );
}
