'use client';
import { useState, useEffect } from 'react';

type VoiceInfo = { name: string; lang: string; default: boolean };

export function PlayerControls({
  onPlay, onPause, onResume, onStop, onPrev, onNext, onSpeed, onSkip,
  isPlaying,
  voices,
  currentVoice,
  onVoiceChange,
}: {
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeed: (rate: number) => void;
  onSkip: () => void;
  isPlaying: boolean;
  voices: VoiceInfo[];
  currentVoice: string | null;
  onVoiceChange: (name: string) => void;
}) {
  const [rate, setRate] = useState(1);

  return (
    <div style={{ marginTop: 24 }}>
      {/* Primary controls */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onPrev} style={btn}>⏮</button>

        {isPlaying ? (
          <button onClick={onPause} style={{ ...btn, background: 'var(--accent)', color: '#fff', minWidth: 80 }}>
            ⏸ 暂停
          </button>
        ) : (
          <button onClick={onResume} style={{ ...btn, background: 'var(--accent)', color: '#fff', minWidth: 80 }}>
            ▶ 继续
          </button>
        )}

        <button onClick={onStop} style={btn}>⏹</button>
        <button onClick={onSkip} style={btn}>⏭ 15s</button>
        <button onClick={onNext} style={btn}>⏭</button>
      </div>

      {/* Second row: speed + voice */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <label style={rowLabel}>
          语速
          <select value={rate} onChange={e => { const r = Number(e.target.value); setRate(r); onSpeed(r); }} style={selectStyle}>
            {[0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}×</option>)}
          </select>
        </label>

        <label style={rowLabel}>
          语音
          <select
            value={currentVoice ?? ''}
            onChange={e => onVoiceChange(e.target.value)}
            style={{ ...selectStyle, maxWidth: 200 }}
          >
            <option value="">默认</option>
            {voices.map(v => (
              <option key={v.name} value={v.name}>
                {v.name.replace(/Microsoft\s*/i, '').replace(/\s*Online\s*\(Natural\)/i, '')}
                {' '}({v.lang})
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8, border: '1px solid #ccc',
  background: '#fff', cursor: 'pointer', fontSize: 16,
};

const rowLabel: React.CSSProperties = {
  fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc',
  background: '#fff', fontSize: 14,
};
