import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { pageMetadata } from '@/lib/seo';
import { ContentPage } from '@/components/sections/content/content-page';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tenant = await getCurrentTenant();
    const page = tenant.sections.pages?.[slug];
    if (!page) return {};
    const co = (t?: string) => (t ? withCompany(t, tenant.name) : undefined);
    const m = page.meta ?? {};
    return pageMetadata({
      tenant,
      path: `/${slug}`,
      title: co(m.title) ?? co(page.h1) ?? tenant.name,
      description: co(m.description),
      ogTitle: co(m.og_title),
      ogDescription: co(m.og_description),
      ogImage: m.og_image,
      ogImageAlt: co(m.og_image_alt),
      canonical: m.canonical,
      noindex: m.noindex,
    });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return {};
    throw err;
  }
}

export default async function DynamicContentPage({ params }: Params) {
  const { slug } = await params;
  const tenant = await getCurrentTenant();
  const page = tenant.sections.pages?.[slug];
  if (!page) notFound();
  return <ContentPage tenant={tenant} page={page} path={`/${slug}`} />;
}
