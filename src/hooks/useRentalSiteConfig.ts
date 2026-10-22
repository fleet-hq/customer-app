'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  DAILY_ONLY,
  getOngoingQuote,
  getRenterRental,
  getRentalSiteConfig,
  giveRenterNotice,
  type OngoingQuotePayload,
  type RentalSiteConfig,
} from '@/services/rentalServices';
import { useDebounce } from './use-debounce';
import { useTenant } from '@/lib/tenant-context';
import { rateCard, type RateCard } from '@/lib/rate-card';
import { released } from '@/lib/release';

export function useRentalSiteConfig(): RentalSiteConfig & { ready: boolean } {
  const tenant = useTenant();
  const { data, isFetched } = useQuery({
    queryKey: ['rental-site-config', tenant.slug],
    queryFn: () => getRentalSiteConfig(tenant.domain),
    staleTime: 60_000,
    retry: false,
  });
  const config = data ?? DAILY_ONLY;
  return {
    ...config,
    models: released('modelTabs') ? config.models : config.models.filter((model) => model === 'daily'),
    website_ongoing: released('websiteOngoing') && config.website_ongoing,
    ready: isFetched,
  };
}

export function useRateCard(vehicle: Parameters<typeof rateCard>[0]): RateCard {
  return rateCard(vehicle, useRentalSiteConfig());
}

export function useOngoingQuote(payload: OngoingQuotePayload | null) {
  const debounced = useDebounce(payload, 250);
  const query = useQuery({
    queryKey: ['ongoing-quote', debounced],
    queryFn: () => getOngoingQuote(debounced!),
    enabled: !!debounced,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  });
  const stale = JSON.stringify(debounced) !== JSON.stringify(payload) || query.isFetching;
  return { quote: payload ? query.data : undefined, stale };
}

export function useRenterRental(bookingId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['renter-rental', bookingId],
    queryFn: getRenterRental,
    enabled: enabled && !!bookingId,
    retry: false,
  });
}

export function useGiveRenterNotice(bookingId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: giveRenterNotice,
    onSuccess: (data) => client.setQueryData(['renter-rental', bookingId], data),
  });
}
