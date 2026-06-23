'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getFleetDiscountsSummary,
  type FleetDiscountsSummary,
} from '@/services/discountServices';
import { useTenant } from '@/lib/tenant-context';

/** React-Query wrapper around the public discounts-summary endpoint.
 *  Used by the homepage to derive the top promo banner. */
export function useFleetDiscountsSummary() {
  const tenant = useTenant();
  return useQuery<FleetDiscountsSummary>({
    queryKey: ['fleet-discounts-summary', tenant.slug],
    queryFn: () => getFleetDiscountsSummary(tenant.domain),
    staleTime: 5 * 60 * 1000,
  });
}
