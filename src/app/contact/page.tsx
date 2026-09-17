import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { pageMetadata } from '@/lib/seo';
import { ContentPage } from '@/components/sections/content/content-page';
import { InquiryPageBody } from '@/components/sections/inquiry/inquiry-page';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getCurrentTenant();
    const page = tenant.sections.pages?.contact;
    if (!page) return { title: `Contact — ${tenant.name}` };
    const co = (t?: string) => (t ? withCompany(t, tenant.name) : undefined);
    const m = page.meta ?? {};
    return pageMetadata({
      tenant,
      path: '/contact',
      title: co(m.title) ?? `Contact — ${tenant.name}`,
      description: co(m.description),
      ogTitle: co(m.og_title),
      ogDescription: co(m.og_description),
      ogImage: m.og_image,
      ogImageAlt: co(m.og_image_alt),
      canonical: m.canonical,
      noindex: m.noindex,
    });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Contact' };
    throw err;
  }
}

export default async function ContactPage() {
  const tenant = await getCurrentTenant();
  const page = tenant.sections.pages?.contact;
  if (page) return <ContentPage tenant={tenant} page={page} path="/contact" heroImage={page.hero_image} />;
  return <InquiryPageBody />;
}
