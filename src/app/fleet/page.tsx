import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { pageMetadata } from '@/lib/seo';
import { fleetSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/json-ld';
import FleetClient from './fleet-client';

const FLEET_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'Fleet', href: '/fleet' },
];

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getCurrentTenant();
    const fp = tenant.sections.fleet_page;
    if (!fp) return { title: `Our Fleet — ${tenant.name}` };
    const co = (t?: string) => (t ? withCompany(t, tenant.name) : undefined);
    return pageMetadata({
      tenant,
      path: '/fleet',
      title: co(fp.meta_title) ?? `Our Fleet — ${tenant.name}`,
      description: co(fp.meta_description),
      ogTitle: co(fp.og_title),
      ogDescription: co(fp.og_description),
      ogImage: fp.og_image,
    });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Our Fleet' };
    throw err;
  }
}

export default async function FleetPage() {
  const tenant = await getCurrentTenant();
  const fp = tenant.sections.fleet_page;
  return (
    <>
      {fp?.vehicles?.length ? (
        <JsonLd data={fleetSchema(tenant, fp.vehicles, fp.faqs, FLEET_TRAIL)} />
      ) : null}
      <FleetClient />
    </>
  );
}
