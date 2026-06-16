import { NextRequest, NextResponse } from 'next/server';
import { tokenBucket } from './src/lib/ratelimit';

export const config = {
  matcher: ['/api/briefing/:path*', '/api/rss/:path*'],
};

const bucket = tokenBucket({ capacity: 10, refillPerSec: 0.05 }); // 10 burst, then 1 / 20s

export default function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (!bucket.tryConsume(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  return NextResponse.next();
}
