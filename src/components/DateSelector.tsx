'use client';
import { useMemo } from 'react';

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

export function DateSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = useMemo(() => fmt(new Date()), []);
  const yesterday = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return fmt(d);
  }, []);

  return (
    <div>
      <h3>日期</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onChange(today)}
          style={{ background: value === today ? 'var(--accent)' : '#fff', color: value === today ? '#fff' : 'var(--fg)', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          今天 ({today})
        </button>
        <button
          onClick={() => onChange(yesterday)}
          style={{ background: value === yesterday ? 'var(--accent)' : '#fff', color: value === yesterday ? '#fff' : 'var(--fg)', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          昨天 ({yesterday})
        </button>
      </div>
    </div>
  );
}
