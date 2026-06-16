import { NextRequest, NextResponse } from 'next/server';
import { generateBriefing } from '@/lib/briefing/generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  if (!body || typeof body.device_id !== 'string' || typeof body.date !== 'string' || typeof body.length_minutes !== 'number' || !Array.isArray(body.topic_ids)) {
    return NextResponse.json({ error: 'device_id, date, length_minutes, and topic_ids are required' }, { status: 400 });
  }

  try {
    const script = await generateBriefing(body);
    return NextResponse.json(script);
  } catch (e: any) {
    if (e.status === 422) {
      return NextResponse.json({ error: 'no_articles' }, { status: 422 });
    }
    console.error('briefing generation failed:', e);
    return NextResponse.json({ error: 'internal' }, { status: 503 });
  }
}
