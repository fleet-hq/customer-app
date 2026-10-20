import axios from 'axios';
import { NextResponse, type NextRequest } from 'next/server';

import { resolveRequestHost } from '@/lib/get-tenant';
import {
  PROMO_COOKIE,
  TRACKING_COOKIE,
  VISITOR_COOKIE,
  WINDOW_SECONDS,
  formatTag,
  parseTag,
  tagIsLive,
} from '@/lib/tracking-tag';

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface ScanResult {
  code: string;
  path: string;
  promo_code: string;
}

async function scan(host: string, code: string, visitor: string): Promise<ScanResult | null> {
  try {
    const res = await axios.post<ScanResult>(
      `${BACKEND_URL}/api/tracking/public/scan/`,
      { code, visitor },
      { params: { domain: host }, timeout: 5000 },
    );
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) return null;
    throw err;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const host = await resolveRequestHost();
  const visitor = request.cookies.get(VISITOR_COOKIE)?.value ?? crypto.randomUUID();
  const result = await scan(host, code.toLowerCase(), visitor);
  const proto = request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const response = NextResponse.redirect(`${proto}://${host}${result?.path ?? '/'}`);
  const cookie = { path: '/', maxAge: WINDOW_SECONDS, sameSite: 'lax' as const };
  response.cookies.set(VISITOR_COOKIE, visitor, { ...cookie, maxAge: 365 * 24 * 60 * 60 });
  if (result) {
    const current = parseTag(request.cookies.get(TRACKING_COOKIE)?.value);
    if (!tagIsLive(current)) {
      response.cookies.set(TRACKING_COOKIE, formatTag({ code: result.code, seenAt: new Date().toISOString() }), cookie);
    }
    if (result.promo_code) response.cookies.set(PROMO_COOKIE, result.promo_code, cookie);
  }
  return response;
}
