'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopicPicker } from '@/components/TopicPicker';
import { LengthSlider } from '@/components/LengthSlider';
import { DateSelector } from '@/components/DateSelector';
import { GenerateButton } from '@/components/GenerateButton';
import { getOrCreateDeviceId } from '@/lib/device';

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function Home() {
  const router = useRouter();
  const [topics, setTopics] = useState<number[]>([]);
  const [length, setLength] = useState(8);
  const [date, setDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onGenerate = async () => {
    setLoading(true); setErr(null);
    const deviceId = getOrCreateDeviceId();
    try {
      // Persist prefs first
      await fetch('/api/prefs', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, topic_ids: topics, length_minutes: length }),
      });
      // Save topics and length locally so the player page can re-fetch with the same selection
      localStorage.setItem('dayilydose.topics', JSON.stringify(topics));
      localStorage.setItem('dayilydose.length', String(length));
      // Trigger generation
      const res = await fetch('/api/briefing/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, date, length_minutes: length, topic_ids: topics }),
      });
      if (res.status === 422) {
        setErr('所选日期没有新闻，请换 topic 或改日期');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push(`/player?date=${date}`);
    } catch (e: any) {
      setErr(String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>DayilyDose</h1>
      <p>把你关心的行业转成每日音频简报。</p>
      <DateSelector value={date} onChange={setDate} />
      <TopicPicker value={topics} onChange={setTopics} />
      <LengthSlider value={length} onChange={setLength} />
      <GenerateButton disabled={topics.length === 0} loading={loading} onClick={onGenerate} />
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </main>
  );
}
