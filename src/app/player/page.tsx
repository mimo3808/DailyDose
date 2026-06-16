'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrCreateDeviceId } from '@/lib/device';
import { CoverArt } from '@/components/CoverArt';
import { ChapterList } from '@/components/ChapterList';
import { createTts } from '@/lib/tts/synthesize';
import type { ScriptJson } from '@/types';

type VoiceInfo = { name: string; lang: string; default: boolean };

function PlayerInner() {
  const params = useSearchParams();
  const date = params.get('date') ?? new Date().toISOString().slice(0, 10);
  const [script, setScript] = useState<ScriptJson | null>(null);
  const [current, setCurrent] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [voiceName, setVoiceName] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem('dayilydose.voice') ?? '' : ''
  );
  const tts = createTts();
  const lengthMinutes = Number(typeof window !== 'undefined' ? localStorage.getItem('dayilydose.length') ?? 8 : 8);

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    fetch('/api/briefing/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        date,
        length_minutes: lengthMinutes,
        topic_ids: JSON.parse(localStorage.getItem('dayilydose.topics') ?? '[]'),
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setScript)
      .catch(e => setErr(String(e)));
  }, [date]);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const all = speechSynthesis.getVoices();
      if (!all.length) return;
      setVoices(
        all
          .filter(v => v.lang.startsWith('zh') || v.lang.startsWith('en'))
          .map(v => ({ name: v.name, lang: v.lang, default: v.default }))
      );
    };
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Persist voice choice
  useEffect(() => {
    if (voiceName) localStorage.setItem('dayilydose.voice', voiceName);
  }, [voiceName]);

  // Media Session
  useEffect(() => {
    if (!script || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: script.title,
      artist: 'DayilyDose',
    });
  }, [script]);

  if (err) return <main style={{ padding: 24 }}><p style={{ color: 'red' }}>{err}</p></main>;
  if (!script) return <main style={{ padding: 24 }}><p>加载中…</p></main>;

  if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
    return (
      <main style={{ padding: 24 }}>
        <h1>{script.title}</h1>
        <p style={{ color: 'red' }}>当前浏览器不支持 Web Speech API，无法朗读。请改用 Chrome 或 Edge。</p>
        <ChapterList chapters={script.chapters} current={current} onSelect={() => {}} />
      </main>
    );
  }

  const playChapter = (idx: number) => {
    setCurrent(idx);
    const chapter = script.chapters.find(c => c.idx === idx);
    if (!chapter) return;
    tts.stop();
    setIsPlaying(true);
    tts.speak(chapter.script_text, {
      voiceName: voiceName || undefined,
      onDone: () => {
        if (idx < script.chapters.length) {
          playChapter(idx + 1);
        } else {
          setIsPlaying(false);
        }
      },
    });
  };

  const onPause = () => { tts.pause(); setIsPlaying(false); };
  const onResume = () => { tts.resume(); setIsPlaying(true); };

  const speakCurrentWithRate = (rate: number) => {
    const ch = script.chapters.find(c => c.idx === current);
    if (!ch) return;
    tts.stop();
    setIsPlaying(true);
    tts.speak(ch.script_text, {
      rate,
      voiceName: voiceName || undefined,
      onDone: () => {
        if (current < script.chapters.length) playChapter(current + 1);
        else setIsPlaying(false);
      },
    });
  };

  const onRegenerate = async () => {
    setRegenerating(true);
    tts.stop();
    setIsPlaying(false);
    const deviceId = getOrCreateDeviceId();
    await fetch('/api/briefing/regenerate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, date }),
    });
    const res = await fetch('/api/briefing/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        date,
        length_minutes: lengthMinutes,
        topic_ids: JSON.parse(localStorage.getItem('dayilydose.topics') ?? '[]'),
      }),
    });
    if (res.ok) {
      const newScript = await res.json();
      setScript(newScript);
      setCurrent(1);
    }
    setRegenerating(false);
  };

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <CoverArt title={script.title} />
      <h1 style={{ textAlign: 'center' }}>{script.title}</h1>
      <p style={{ textAlign: 'center', color: 'var(--muted)' }}>{date} · {script.chapters.length} 章</p>

      <ChapterList chapters={script.chapters} current={current} onSelect={(idx) => { playChapter(idx); }} />

      <PlayerControls
        onPlay={() => playChapter(current)}
        onPause={onPause}
        onResume={onResume}
        onStop={() => { tts.stop(); setIsPlaying(false); }}
        onPrev={() => current > 1 && playChapter(current - 1)}
        onNext={() => current < script.chapters.length && playChapter(current + 1)}
        onSpeed={speakCurrentWithRate}
        onSkip={() => speakCurrentWithRate(1)}
        isPlaying={isPlaying}
        voices={voices}
        currentVoice={voiceName}
        onVoiceChange={(name) => setVoiceName(name)}
      />

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={onRegenerate} disabled={regenerating} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 8, background: '#fff', cursor: regenerating ? 'wait' : 'pointer' }}>
          {regenerating ? '重新生成中…' : '🔄 重新生成'}
        </button>
      </div>
    </main>
  );
}

import { PlayerControls } from '@/components/PlayerControls';

export default function PlayerPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}><p>加载中…</p></main>}>
      <PlayerInner />
    </Suspense>
  );
}
