import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/** Per-customer routes carry booking tokens and personal details, so they
 *  are kept out of search results even though they are reachable. */
const PRIVATE_PATHS = [
  '/booking/',
  '/bookings',
  '/manage',
  '/pay/',
  '/terms?',
  '/rental-agreement',
  '/sign-in',
  '/register',
  '/*?*sort=',
  '/*?*filter=',
];

const ANSWER_ENGINES = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'Claude-SearchBot',
  'Claude-User',
  'ClaudeBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host');
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      ...ANSWER_ENGINES.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE_PATHS })),
    ],
    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  };
}
