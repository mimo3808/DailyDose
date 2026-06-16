import { NextRequest, NextResponse } from 'next/server';
import { clearDailyCache } from '@/lib/briefing/generator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }
  const { device_id, date } = body;
  if (!device_id || !date) {
    return NextResponse.json({ error: 'device_id and date required' }, { status: 400 });
  }
  await clearDailyCache(device_id, date);
  return NextResponse.json({ ok: true });
}
