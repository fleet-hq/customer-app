import { headers } from 'next/headers';

import { getCurrentTenant } from '@/lib/get-tenant';
import { getTenantBlogs } from '@/lib/get-blogs';
import { paths } from '@/lib/paths';

export const dynamic = 'force-dynamic';

/**
 * A plain fact sheet for AI assistants, built from what the operator has
 * already filled in.
 *
 * Same idea as robots.txt and sitemap.xml next door: one route, every
 * tenant, nothing hardcoded. Assistants that read this cite the
 * operator's own numbers rather than guessing from rendered pages, so
 * the file is generated from the tenant record and stays correct when
 * they change their prices — a file uploaded to the site root would
 * not.
 *
 * Sections appear only when there is something to put in them, for the
 * same reason the site itself renders nothing an operator has not
 * supplied.
 */
export async function GET() {
  const tenant = await getCurrentTenant();
  const host = (await headers()).get('host');
  const origin = host ? `https://${host}` : '';

  const { brand, footer, sections } = tenant;
  const contact = footer.contact;
  const seo = sections.seo;

  const lines: string[] = [`# ${tenant.name}`, ''];

  const summary = footer.description || brand.description;
  if (summary) lines.push(`> ${summary}`, '');

  const facts: string[] = [];
  const fact = (label: string, value?: string | null) => {
    if (value && value.trim()) facts.push(`- ${label}: ${value.trim()}`);
  };
  fact('Business name', tenant.name);
  fact('Address', contact.address);
  fact('Phone', contact.phone);
  fact('Email', contact.email);
  fact('Website', origin || undefined);
  fact('Areas served', seo?.serving);
  fact('Price range', seo?.price_range);
  fact('Delivery', seo?.delivery_note);
  if (facts.length) lines.push('## Key facts', '', ...facts, '');

  // The operator's own pages, with the description they wrote for each.
  const pages = sections.pages ?? {};
  const pageLines = Object.keys(pages)
    .filter((slug) => !pages[slug]?.meta?.noindex)
    .map((slug) => {
      const page = pages[slug];
      const title = page?.meta?.title || page?.h1 || slug;
      const url = slug === 'home' ? `${origin}${paths.home}` : `${origin}${paths.page(slug)}`;
      const blurb = page?.meta?.description || page?.intro?.[0] || '';
      return `- [${title}](${url})${blurb ? `: ${blurb}` : ''}`;
    });
  if (pageLines.length) lines.push('## Pages', '', ...pageLines, '');

  const faqs = sections.faqs?.items ?? [];
  if (faqs.length) {
    lines.push('## Common questions', '');
    for (const item of faqs) {
      if (item.question && item.answer) lines.push(`- ${item.question} ${item.answer}`);
    }
    lines.push('');
  }

  const posts = await getTenantBlogs();
  if (posts.length) {
    lines.push('## Optional', '');
    for (const post of posts) {
      const blurb = post.excerpt;
      lines.push(`- [${post.title}](${origin}${paths.blogPost(post.slug)})${blurb ? `: ${blurb}` : ''}`);
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
