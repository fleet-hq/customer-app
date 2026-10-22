import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { pageMetadata } from '@/lib/seo';
import { released } from '@/lib/release';
import { RENTAL_TABS } from '@/lib/rental-tabs';
import type { RentalModel } from '@/services/rentalServices';
import FleetClient from './fleet-client';

export async function modelPageMetadata(model: Exclude<RentalModel, 'daily'>): Promise<Metadata> {
  const tab = RENTAL_TABS.find((t) => t.model === model)!;
  try {
    const tenant = await getCurrentTenant();
    return pageMetadata({ tenant, path: tab.href, title: `${tab.label} — ${tenant.name}` });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: tab.label };
    throw err;
  }
}

export async function ModelFleetPage() {
  if (!released('modelTabs')) notFound();
  await getCurrentTenant();
  return <FleetClient />;
}
