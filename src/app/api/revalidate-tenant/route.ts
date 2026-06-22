import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { TENANT_TAG, tenantTag } from '@/lib/get-tenant';

/**
 * Bust the tenant-content cache for one host (or globally) when an
 * admin saves new content. The backend (or the super-admin app) is
 * expected to call this with a shared secret in the ``Authorization``
 * header right after a successful save:
 *
 *   POST /api/revalidate-tenant
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   Body: { "host": "abc.com" }   // or "*" for every tenant
 *
 * Without this hook the cache TTL (60s) is the upper bound on how
 * stale published content can be; with it the next request after a
 * save renders the fresh copy.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET is not configured' },
      { status: 500 },
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  let host = '';
  try {
    const body = (await req.json()) as { host?: string };
    host = (body.host ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!host) {
    return NextResponse.json({ error: 'missing host' }, { status: 400 });
  }
  // Next 16: ``revalidateTag(tag, 'max')`` evicts immediately. Using
  // ``'max'`` matches the semantics we want — clients should see the
  // new content on their next request, not after another TTL.
  if (host === '*') {
    revalidateTag(TENANT_TAG, 'max');
    return NextResponse.json({ revalidated: 'all' });
  }
  revalidateTag(tenantTag(host), 'max');
  return NextResponse.json({ revalidated: host });
}
