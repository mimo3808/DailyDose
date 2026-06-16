import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  topic_ids: [] as number[],
  length_minutes: 8,
  voice_pref: null as string | null,
  language: 'zh',
};

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get('device_id');
  if (!deviceId) return NextResponse.json({ error: 'device_id required' }, { status: 400 });
  const rows = await query<any>(`SELECT * FROM user_prefs WHERE device_id = $1`, [deviceId]);
  if (!rows.length) return NextResponse.json({ device_id: deviceId, ...DEFAULTS });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { device_id, topic_ids, length_minutes, voice_pref, language } = body;
  if (!device_id) return NextResponse.json({ error: 'device_id required' }, { status: 400 });
  const rows = await query<any>(
    `INSERT INTO user_prefs (device_id, topic_ids, length_minutes, voice_pref, language, updated_at)
     VALUES ($1, $2::jsonb, $3, $4, $5, NOW())
     ON CONFLICT (device_id) DO UPDATE SET
       topic_ids = EXCLUDED.topic_ids,
       length_minutes = EXCLUDED.length_minutes,
       voice_pref = EXCLUDED.voice_pref,
       language = EXCLUDED.language,
       updated_at = NOW()
     RETURNING *`,
    [
      device_id,
      JSON.stringify(topic_ids ?? DEFAULTS.topic_ids),
      length_minutes ?? DEFAULTS.length_minutes,
      voice_pref ?? DEFAULTS.voice_pref,
      language ?? DEFAULTS.language,
    ]
  );
  return NextResponse.json(rows[0]);
}
