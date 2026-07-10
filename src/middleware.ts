import { NextResponse, type NextRequest } from 'next/server';

const TENANT_QUERY_PARAM = 'tenant';
const TENANT_HEADER = 'x-fleethq-tenant-slug';

/**
 * Widget-only tenants (Rentel-style clients on Webflow / Wix / their own
 * CMS) load our shared hosted checkout at fleethq-book.vercel.app inside
 * an iframe. Their Host header is that shared URL, not the tenant's own
 * domain, so the normal `getCurrentTenant` lookup would fail.
 *
 * When the URL carries `?tenant=<slug>`, promote it to a request header so
 * server-side `getCurrentTenant` can identify the tenant without a Host
 * match. Existing tenants who host at their own domain (kaysgroove et al.)
 * hit us WITHOUT this param — middleware is a no-op for them.
 */
export function middleware(request: NextRequest): NextResponse {
  const slug = request.nextUrl.searchParams.get(TENANT_QUERY_PARAM);
  if (!slug) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_HEADER, slug.toLowerCase());
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Skip static assets, Next internals, and API routes we control.
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|js|css|woff2?)).*)',
  ],
};
