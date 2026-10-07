import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

/** Per-customer routes carry booking tokens and personal details, so they
 *  are kept out of search results even though they are reachable. */
const PRIVATE_PATHS = ['/booking/', '/bookings', '/manage', '/pay/', '/terms?', '/rental-agreement'];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVATE_PATHS }],
    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  };
}
