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
      <div className="date-options mt-2">
        <button
          onClick={() => onChange(today)}
          className={`chip${value === today ? ' chip--active' : ''}`}
        >
          今天（{today}）
        </button>
        <button
          onClick={() => onChange(yesterday)}
          className={`chip${value === yesterday ? ' chip--active' : ''}`}
        >
          昨天（{yesterday}）
        </button>
      </div>
    </div>
  );
}
