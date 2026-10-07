import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { paths } from '@/lib/paths';

/** Routes every tenant site serves. Booking, checkout and account pages
 *  are deliberately absent — they are per-customer and carry tokens. */
const STATIC_PATHS = [paths.home, paths.fleet, paths.contact];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host');
  if (!host) return [];
  const origin = `https://${host}`;

  let tenant;
  try {
    tenant = await getCurrentTenant();
  } catch (err) {
    // An unknown host has nothing to list rather than erroring the route.
    if (err instanceof TenantNotFoundError) return [];
    throw err;
  }

  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified,
    changeFrequency: path === paths.home ? 'weekly' : 'monthly',
    priority: path === paths.home ? 1 : 0.8,
  }));

  // The tenant's own content pages — the pages that differ per tenant and
  // are the whole point of indexing a customised site.
  for (const slug of Object.keys(tenant.sections.pages ?? {})) {
    const page = tenant.sections.pages?.[slug];
    if (page?.meta?.noindex) continue;
    // /contact already has a canonical entry above.
    if (`/${slug}` === paths.contact) continue;
    entries.push({
      url: `${origin}${paths.page(slug)}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  if (tenant.sections.services) {
    entries.push({
      url: `${origin}${paths.services}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
