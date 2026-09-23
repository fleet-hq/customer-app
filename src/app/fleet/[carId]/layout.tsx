import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { pageMetadata } from '@/lib/seo';
import { getFleetById } from '@/services/fleetServices';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ carId: string }>;
}): Promise<Metadata> {
  // carId is the vehicle's slug (or, for older links, its numeric id) —
  // the backend resolves either at the same lookup path.
  const { carId } = await params;

  try {
    const tenant = await getCurrentTenant();
    const vehicle = await getFleetById(carId, undefined, tenant.domain).catch(() => null);
    if (!vehicle) return { title: `Book a car — ${tenant.name}` };

    const title = `${vehicle.name} ${vehicle.year} — Book now | ${tenant.name}`;
    const description =
      vehicle.description || `Reserve the ${vehicle.name} ${vehicle.year} for your next trip with ${tenant.name}.`;

    return pageMetadata({
      tenant,
      path: `/fleet/${carId}`,
      title,
      description,
      ogImage: vehicle.image && vehicle.image !== PLACEHOLDER_IMAGE ? vehicle.image : undefined,
      ogImageAlt: `${vehicle.name} ${vehicle.year}`,
      // Each renter's checkout link is a private booking flow, not a page
      // that should show up in search results.
      noindex: true,
    });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Book a car' };
    throw err;
  }
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
