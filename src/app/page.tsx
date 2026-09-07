import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { pageMetadata } from '@/lib/seo';
import HomeClient from './home-client';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getCurrentTenant();
    const page = tenant.sections.pages?.home;
    if (!page) {
      return { title: `${tenant.name} — Car Rentals`, description: tenant.brand.description };
    }
    const co = (t?: string) => (t ? withCompany(t, tenant.name) : undefined);
    const m = page.meta ?? {};
    return pageMetadata({
      tenant,
      path: '/',
      title: co(m.title) ?? `${tenant.name} — Car Rentals`,
      description: co(m.description) ?? tenant.brand.description,
      ogTitle: co(m.og_title),
      ogDescription: co(m.og_description),
      ogImage: m.og_image,
      ogImageAlt: co(m.og_image_alt),
      canonical: m.canonical,
      noindex: m.noindex,
    });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Site setup in progress' };
    throw err;
  }
}

export default function HomePage() {
  return <HomeClient />;
}
