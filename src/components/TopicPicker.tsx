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

  if (err) return <p className="text-error">加载 topic 失败：{err}</p>;
  if (!topics.length) return <p className="text-muted">加载中…</p>;

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };

  return (
    <div>
      <h3>选择你关心的行业</h3>
      <div className="chip-group mt-2">
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            disabled={t.active_source_count === 0}
            className={`chip${value.includes(t.id) ? ' chip--active' : ''}${t.active_source_count === 0 ? ' chip--disabled' : ''}`}
          >
            {t.name_zh}
            <span className="chip__count">({t.active_source_count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
