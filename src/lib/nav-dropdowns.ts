import type { Tenant } from '@/lib/tenant';

export interface NavChild {
  href: string;
  label: string;
}

/**
 * The children a nav item expands to, derived from content the operator
 * has already written.
 *
 * Two sources, in order:
 *
 *   /services        → the blocks of the services section
 *   /<content-page>  → that page's blocks, where a block links somewhere
 *
 * So an operator who has built an overview page gets a dropdown to its
 * sections without restating them in the nav, and a nav item with
 * nothing beneath it stays an ordinary link. Both templates read this,
 * which is why it is here rather than inside either header.
 */
export function navDropdownFor(tenant: Tenant, href: string): NavChild[] {
  if (href === '/services') {
    return (tenant.sections.services?.blocks ?? [])
      .filter((block) => block.href)
      .map((block) => ({
        href: block.href as string,
        label: block.heading || block.link_label || '',
      }))
      .filter((child) => child.label);
  }

  const page = tenant.sections.pages?.[href.replace(/^\//, '')];
  if (!page) return [];
  return (page.blocks ?? [])
    .map((block) => ({ href: block.link?.href ?? '', label: block.heading ?? '' }))
    .filter((child) => child.href && child.label);
}
