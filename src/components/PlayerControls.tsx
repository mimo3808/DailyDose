'use client';
import { useState } from 'react';

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
    <div className="mt-6">
      <div className="controls-row">
        <button onClick={onPrev} className="btn" title="上一章">⏮</button>

        {isPlaying ? (
          <button onClick={onPause} className="btn btn--primary">⏸ 暂停</button>
        ) : (
          <button onClick={onResume} className="btn btn--primary">▶ 继续</button>
        )}

        <button onClick={onStop} className="btn">⏹</button>
        <button onClick={onSkip} className="btn">⏭ 15s</button>
        <button onClick={onNext} className="btn" title="下一章">⏭</button>
      </div>

      <div className="controls-row controls-row--secondary">
        <label className="label">
          语速
          <select value={rate} onChange={e => { const r = Number(e.target.value); setRate(r); onSpeed(r); }} className="select">
            {[0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}×</option>)}
          </select>
        </label>

        <label className="label">
          语音
          <select
            value={currentVoice ?? ''}
            onChange={e => onVoiceChange(e.target.value)}
            className="select"
            style={{ maxWidth: 200 }}
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
