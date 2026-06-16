'use client';
import { useState } from 'react';

export function PlayerControls({
  onPlay, onStop, onPrev, onNext, onSpeed,
}: {
  onPlay: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeed: (rate: number) => void;
}) {
  const [rate, setRate] = useState(1);
  return (
    <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={onPrev} style={btn}>◀ 上一章</button>
      <button onClick={onPlay} style={{ ...btn, background: 'var(--accent)', color: '#fff' }}>▶ 播放</button>
      <button onClick={onStop} style={btn}>⏹ 停止</button>
      <button onClick={onNext} style={btn}>下一章 ▶</button>
      <label style={{ marginLeft: 16 }}>
        倍速：
        <select value={rate} onChange={e => { const r = Number(e.target.value); setRate(r); onSpeed(r); }} style={{ marginLeft: 4 }}>
          {[0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}×</option>)}
        </select>
      </label>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer',
};
