'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getFleetDiscountsSummary,
  type FleetDiscountsSummary,
} from '@/services/discountServices';

/** React-Query wrapper around the public discounts-summary endpoint.
 *  Used by the homepage to derive the top promo banner. */
export function useFleetDiscountsSummary() {
  return useQuery<FleetDiscountsSummary>({
    queryKey: ['fleet-discounts-summary'],
    queryFn: getFleetDiscountsSummary,
    staleTime: 5 * 60 * 1000,
  });
}
