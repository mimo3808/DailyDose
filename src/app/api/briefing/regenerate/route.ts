import { NextRequest, NextResponse } from 'next/server';
import { clearDailyCache } from '@/lib/briefing/generator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { device_id, date } = await req.json();
  if (!device_id || !date) {
    return NextResponse.json({ error: 'device_id and date required' }, { status: 400 });
  }
  await clearDailyCache(device_id, date);
  return NextResponse.json({ ok: true });
}
