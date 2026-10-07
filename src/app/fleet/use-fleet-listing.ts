'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { INITIAL_FILTERS, activeFilterCount, type FilterState } from '@/components/fleet/fleet-filters';
import { useTenant } from '@/lib/tenant-context';
import { useFleets, useFleetAvailability, useCompanyLocations } from '@/hooks';
import { useDefaultLocation } from '@/contexts';
import { toUtcIso } from '@/utils/datetime';
import { rentalDays } from '@/lib/utils';
import { activeTier } from '@/lib/discount-tiers';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { trackFleetList } from '@/lib/tracking-events';

export const SORTS = ['Recommended', 'Price: low to high', 'Price: high to low'] as const;
const PAGE_SIZE = 12;

export const CATEGORY_LABELS: Record<string, string> = {
  'small-cars': 'Small Cars',
  sedans: 'Sedans',
  'compact-suvs': 'Compact & SUVs',
  'premium-luxury': 'Premium Luxury',
  'people-carriers': 'People Carriers',
  'electric-hybrid': 'Electric & Hybrid',
};

/** Highest weekly discount percentage configured on this fleet, or 0
 *  when no weekly tier exists. */
function weeklyDiscountPct(v: { discounts?: { unitType: string; percentage: number }[] }): number {
  let best = 0;
  for (const d of v.discounts ?? []) {
    if (d.unitType === 'week' && d.percentage > best) best = d.percentage;
  }
  return best;
}

/** Best-applicable discount % for a given trip duration, mirroring the
 *  backend's per-booking tier logic (bookings/services.py). */
export function applicableDiscountPct(
  discounts: { unitType: string; units: number; percentage: number }[] | undefined,
  hours: number | undefined,
): number {
  if (!discounts?.length || !hours || hours <= 0) return 0;
  const isHourly = hours <= 23;
  const days = Math.ceil(hours / 24);
  const weeks = Math.floor(days / 7);
  let best = 0;
  for (const d of discounts) {
    const qualifies = isHourly
      ? d.unitType === 'hour' && hours >= d.units
      : (d.unitType === 'day' && days >= d.units) || (d.unitType === 'week' && weeks >= d.units);
    if (qualifies && d.percentage > best) best = d.percentage;
  }
  return best;
}

export interface TermRate {
  days: number;
  total: number;
  perDay: number;
  discountPct: number;
}

/** "From" price for a whole rental term, discounts included. Built on
 *  ``applicableDiscountPct`` so a rate shown on a card can never
 *  disagree with what the basket charges for the same duration. */
export function termRate(
  vehicle: { pricePerDay?: number; discounts?: { unitType: string; units: number; percentage: number }[] },
  days: number,
): TermRate | null {
  const perDayBase = vehicle.pricePerDay;
  if (!perDayBase || perDayBase <= 0 || days <= 0) return null;
  const discountPct = applicableDiscountPct(vehicle.discounts, days * 24);
  const perDay = perDayBase * (1 - discountPct / 100);
  return { days, total: perDay * days, perDay, discountPct };
}

export const TERM_DAYS = { daily: 1, weekly: 7, monthly: 30 } as const;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** All fleet-listing data/state — filtering, sorting, pagination,
 *  availability, discount tiers — shared by both templates' fleet
 *  pages so this booking-adjacent logic lives in exactly one place.
 *  Templates differ only in how they render what this returns. */
export function useFleetListing() {
  const tenant = useTenant();
  const searchParams = useSearchParams();

  const { t } = useDynamicTranslation([
    'Loading…',
    'Showing',
    'car',
    'cars',
    'your',
    '-day trip',
    'off daily',
    'Pick your next ride from our fleet.',
    'Search',
    'Fleet Questions',
    ...Object.values(CATEGORY_LABELS),
  ]);

  const [sort, setSort] = useState<string>(SORTS[0]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError } = useFleets(page, search, PAGE_SIZE);
  const { data: companyLocations } = useCompanyLocations();
  const tz = useDefaultLocation()?.timezone ?? null;

  const bookingQuery = useMemo(() => {
    const params = new URLSearchParams();
    ['pickupDate', 'pickupTime', 'returnDate', 'returnTime', 'pickupLocId', 'dropoffLocId'].forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [searchParams]);

  const selectedHours = useMemo(() => {
    const pickupDate = searchParams.get('pickupDate');
    const returnDate = searchParams.get('returnDate');
    if (!pickupDate || !returnDate) return undefined;
    const pickupTime = searchParams.get('pickupTime') || '00:00';
    const returnTime = searchParams.get('returnTime') || '00:00';
    const a = new Date(`${pickupDate}T${pickupTime}`);
    const b = new Date(`${returnDate}T${returnTime}`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return undefined;
    const diffHrs = (b.getTime() - a.getTime()) / (60 * 60 * 1000);
    return diffHrs > 0 ? diffHrs : undefined;
  }, [searchParams]);

  const locationAddressById = useMemo(() => {
    const map = new Map<string, string>();
    for (const loc of companyLocations ?? []) {
      if (loc?.address) map.set(String(loc.id), loc.address);
    }
    return map;
  }, [companyLocations]);

  const type = searchParams.get('type') ?? '';
  const activeLabel = type ? CATEGORY_LABELS[type] ?? type : '';
  const isFiltered = !!type;

  const buildDatetime = (dateKey: string, timeKey: string): string | null => {
    const d = searchParams.get(dateKey);
    const time = searchParams.get(timeKey);
    if (!d || !time) return null;
    return tz ? toUtcIso(d, time, tz) : `${d}T${time}:00`;
  };
  const pickupDatetime = useMemo(() => buildDatetime('pickupDate', 'pickupTime'), [searchParams, tz]);
  const dropoffDatetime = useMemo(() => buildDatetime('returnDate', 'returnTime'), [searchParams, tz]);

  const days = useMemo(() => {
    const from = searchParams.get('pickupDate');
    const to = searchParams.get('returnDate');
    if (!from || !to) return 2;
    return rentalDays(from, to, searchParams.get('pickupTime') ?? '00:00', searchParams.get('returnTime') ?? '00:00');
  }, [searchParams]);

  const pct = useMemo(() => activeTier(days)?.pct ?? 0, [days]);

  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const enrichedResults = useMemo(() => {
    const raw = data?.results ?? [];
    return raw.map((v) => {
      const fallback = locationAddressById.get(String(v.availableLocations?.[0] ?? ''));
      return { ...v, location: v.location || fallback || '' };
    });
  }, [data, locationAddressById]);

  const filterOptions = useMemo(
    () => ({
      vehicleTypes: [...new Set(enrichedResults.map((v) => v.vehicleType).filter(Boolean))].sort(),
      makes: [...new Set(enrichedResults.map((v) => v.make).filter(Boolean))].sort(),
      colors: [...new Set(enrichedResults.map((v) => v.color).filter(Boolean))].sort(),
      seats: [...new Set(enrichedResults.map((v) => v.seats).filter(Boolean))].sort((a, b) => a - b),
    }),
    [enrichedResults],
  );

  const clientFilterCount = activeFilterCount(filters);

  const fleetIds = useMemo(() => enrichedResults.map((v) => v.id), [enrichedResults]);
  const { data: availability, isLoading: isAvailabilityLoading } = useFleetAvailability(
    fleetIds,
    pickupDatetime,
    dropoffDatetime,
  );
  const unavailableIds = useMemo(() => {
    const ids = new Set<string>();
    if (availability) for (const [id, ok] of Object.entries(availability)) if (ok === false) ids.add(id);
    return ids;
  }, [availability]);

  const hasWindow = Boolean(pickupDatetime && dropoffDatetime);

  const vehicles = useMemo(() => {
    let list = [...enrichedResults];
    if (isFiltered) list = list.filter((v) => slugify(v.vehicleType ?? '') === type);
    list = list.filter((v) => {
      if (filters.vehicleType.length && !filters.vehicleType.includes(v.vehicleType ?? '')) return false;
      if (filters.make.length && !filters.make.includes(v.make)) return false;
      if (filters.color.length && !filters.color.includes(v.color)) return false;
      if (filters.seats.length && !filters.seats.includes(v.seats)) return false;
      if (filters.minPrice != null && v.pricePerDay < filters.minPrice) return false;
      if (filters.maxPrice != null && v.pricePerDay > filters.maxPrice) return false;
      if (filters.availableOnly && hasWindow && unavailableIds.has(v.id)) return false;
      return true;
    });
    if (sort === 'Price: low to high') list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === 'Price: high to low') list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (days >= 7) list.sort((a, b) => weeklyDiscountPct(b) - weeklyDiscountPct(a));
    return list;
  }, [enrichedResults, sort, isFiltered, type, filters, days, hasWindow, unavailableIds]);

  // Fire the list-view signal once per distinct result set rather than
  // on every render — filtering and sorting reshuffle `vehicles` on the
  // client without a new page view behind it.
  const listSignature = vehicles.map((v) => v.id).join(',');
  useEffect(() => {
    if (isLoading || vehicles.length === 0) return;
    trackFleetList(vehicles);
    // `listSignature` is the stable identity of the rendered list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listSignature, isLoading]);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clientFiltered = isFiltered || clientFilterCount > 0;
  const shown = clientFiltered ? vehicles.length : count;
  const countLabel = isLoading
    ? t('Loading…')
    : `${t('Showing')} ${shown} ${shown === 1 ? t('car') : t('cars')} · ${t('your')} ${days}${t('-day trip')}${pct > 0 ? ` (${pct}% ${t('off daily')})` : ''}`;

  const heading = isFiltered ? t(activeLabel) : t('Pick your next ride from our fleet.');

  return {
    tenant,
    t,
    sort,
    setSort,
    searchInput,
    setSearchInput,
    page,
    filters,
    setFilters,
    isLoading,
    isError,
    isAvailabilityLoading,
    vehicles,
    filterOptions,
    clientFilterCount,
    bookingQuery,
    selectedHours,
    unavailableIds,
    /** Availability is only resolved for a chosen pickup/drop-off window.
     *  Without one, nothing is known about a vehicle, so a card must not
     *  claim it is available. */
    hasAvailabilityWindow: hasWindow,
    totalPages,
    goToPage,
    countLabel,
    heading,
    isFiltered,
    activeLabel: t(activeLabel),
  };
}
