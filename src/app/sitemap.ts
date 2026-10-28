import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { getCurrentTenant } from '@/lib/get-tenant';
import { getTenantBlogs } from '@/lib/get-blogs';
import { paths } from '@/lib/paths';

// Resolved per request: the tenant, and therefore the page list, depends
// on the host being asked.
export const dynamic = 'force-dynamic';

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
  } catch {
    // An unknown host, or a tenant lookup that failed, has nothing to
    // list. A sitemap is never worth returning an error for — crawlers
    // treat a 5xx as a signal about the whole site.
    return [];
  }

  const lastModified = new Date();
  const listed = new Set<string>(STATIC_PATHS);
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
    if (slug === 'home' || listed.has(paths.page(slug))) continue;
    listed.add(paths.page(slug));
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

  const posts = await getTenantBlogs();
  if (posts.length) {
    entries.push({
      url: `${origin}${paths.blog}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
    for (const post of posts) {
      const stamp = post.updatedAt || post.publishedAt;
      entries.push({
        url: `${origin}${paths.blogPost(post.slug)}`,
        lastModified: stamp ? new Date(stamp) : lastModified,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
