'use client';

import { useQuery } from '@tanstack/react-query';

import { DAILY_ONLY, getRentalSiteConfig, type RentalSiteConfig } from '@/services/rentalServices';
import { useTenant } from '@/lib/tenant-context';
import { rateCard, type RateCard } from '@/lib/rate-card';

export function useRentalSiteConfig(): RentalSiteConfig {
  const tenant = useTenant();
  const { data } = useQuery({
    queryKey: ['rental-site-config', tenant.slug],
    queryFn: () => getRentalSiteConfig(tenant.domain),
    staleTime: 60_000,
    retry: false,
  });
  return data ?? DAILY_ONLY;
}

export function useRateCard(vehicle: Parameters<typeof rateCard>[0]): RateCard {
  return rateCard(vehicle, useRentalSiteConfig());
}
