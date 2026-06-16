import { NextRequest, NextResponse } from 'next/server';
import { runFetchCycle } from '@/lib/rss/pipeline';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse('unauthorized', { status: 401 });
  }
  const result = await runFetchCycle();
  return NextResponse.json(result);
}
