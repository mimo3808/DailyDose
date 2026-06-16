import { NextRequest, NextResponse } from 'next/server';
import { generateBriefing } from '@/lib/briefing/generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();
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
