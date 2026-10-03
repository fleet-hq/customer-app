import { cookies, headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import axios from 'axios';

import { tenantFromApi, type ApiCompanyDetail, type ApiLocation, type Tenant } from './tenant';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './i18n/config';
import { translateTenant } from './i18n/translate-tenant-server';

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** ``TenantNotFoundError`` is thrown when no tenant can be resolved
 *  for the request's Host header. We intentionally do NOT swallow this
 *  with a silent fallback — the caller decides (e.g. render a 404 or
 *  the platform's own landing). */
export class TenantNotFoundError extends Error {
  constructor(public host: string) {
    super(`No tenant registered for host "${host}"`);
    this.name = 'TenantNotFoundError';
  }
}

/** Cache tags applied to a tenant's fetch. Calling
 *  ``revalidateTag(tenantTag(host))`` from an admin write path
 *  invalidates that single tenant's cache without touching others.
 *  ``TENANT_TAG`` invalidates everyone (for global content rollouts). */
export const TENANT_TAG = 'tenant';
export const tenantTag = (host: string) => `tenant:${host.toLowerCase()}`;

const CACHE_REVALIDATE_SECONDS = 60;

async function fetchTenantByHost(host: string): Promise<Tenant> {
  try {
    const [detailRes, locationsRes] = await Promise.all([
      axios.get<ApiCompanyDetail>(`${BACKEND_URL}/api/companies/public/details/`, {
        params: { domain: host },
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      }),
      axios
        .get<{ results?: ApiLocation[] } | ApiLocation[]>(
          `${BACKEND_URL}/api/companies/public/locations/`,
          {
            params: { domain: host },
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
          },
        )
        .catch(() => ({ data: [] }) as { data: ApiLocation[] }),
    ]);
    const locsRaw = locationsRes.data;
    const locations: ApiLocation[] = Array.isArray(locsRaw) ? locsRaw : locsRaw.results ?? [];
    return tenantFromApi(detailRes.data, locations);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw new TenantNotFoundError(host);
    }
    throw err;
  }
}

/** Resolve the tenant host for the current request. Widget-only clients
 *  open our shared checkout at fleethq-book.vercel.app; middleware promotes
 *  ``?tenant=<slug>`` onto ``x-fleethq-tenant-slug`` so we can identify the
 *  tenant without a Host-header match. Tenants on their own domain carry no
 *  such header and resolve via ``x-forwarded-host`` (load balancer) or the
 *  bare ``host``. Shared by the tenant and blog fetches. */
export async function resolveRequestHost(): Promise<string> {
  const h = await headers();
  const paramSlug = (h.get('x-fleethq-tenant-slug') ?? '').toLowerCase();
  if (paramSlug) return paramSlug;
  return (h.get('x-forwarded-host') ?? h.get('host') ?? '').toLowerCase();
}

/** Tag-cached server-side fetch keyed by host. Two layers of dedupe:
 *   1. ``unstable_cache`` — shared across the deployment for 60s and
 *      invalidatable via ``revalidateTag`` per host or globally.
 *   2. ``react.cache`` — dedupes inside a single render so layout +
 *      page + nested server components share one fetch. */
async function readLocaleCookie(): Promise<Locale> {
  try {
    const store = await cookies();
    const value = store.get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const host = await resolveRequestHost();
  if (!host) {
    throw new TenantNotFoundError('');
  }
  const cached = unstable_cache(
    () => fetchTenantByHost(host),
    ['tenant', host],
    { tags: [TENANT_TAG, tenantTag(host)], revalidate: CACHE_REVALIDATE_SECONDS },
  );
  const tenant = await cached();

  const locale = await readLocaleCookie();
  if (locale === DEFAULT_LOCALE) return tenant;

  const cachedTranslation = unstable_cache(
    () => translateTenant(tenant, locale),
    ['tenant-translated', host, locale],
    { tags: [TENANT_TAG, tenantTag(host)], revalidate: CACHE_REVALIDATE_SECONDS },
  );
  return cachedTranslation();
});
