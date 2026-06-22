'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/search-bar';
import { CarCard } from '@/components/fleet/car-card';
import { FleetToolbar } from '@/components/fleet/fleet-toolbar';
import { FleetPagination } from '@/components/fleet/fleet-pagination';
import { INITIAL_FILTERS, activeFilterCount, type FilterState } from '@/components/fleet/fleet-filters';
import { useTenant } from '@/lib/tenant-context';
import { useFleets, useFleetAvailability } from '@/hooks';
import { useDefaultLocation } from '@/contexts';
import { toUtcIso } from '@/utils/datetime';
import { paths } from '@/lib/paths';
import { cn, rentalDays } from '@/lib/utils';
import { activeTier } from '@/lib/discount-tiers';

const SORTS = ['Recommended', 'Price: low to high', 'Price: high to low'] as const;
const PAGE_SIZE = 12;

const CATEGORY_LABELS: Record<string, string> = {
  'small-cars': 'Small Cars',
  sedans: 'Sedans',
  'compact-suvs': 'Compact & SUVs',
  'premium-luxury': 'Premium Luxury',
  'people-carriers': 'People Carriers',
  'electric-hybrid': 'Electric & Hybrid',
};

/** Highest weekly discount percentage configured on this fleet, or 0
 *  when no weekly tier exists. Used both for the card badge and to
 *  bubble weekly-enabled fleets to the top of the grid when the user
 *  has selected a week+ rental. */
function weeklyDiscountPct(v: { discounts?: { unitType: string; percentage: number }[] }): number {
  let best = 0;
  for (const d of v.discounts ?? []) {
    if (d.unitType === 'week' && d.percentage > best) best = d.percentage;
  }
  return best;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function FleetPage() {
  const tenant = useTenant();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState<string>(SORTS[0]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useFleets(page, search, PAGE_SIZE);

  const tz = useDefaultLocation()?.timezone ?? null;
  const type = searchParams.get('type') ?? '';
  const activeLabel = type ? CATEGORY_LABELS[type] ?? type : '';
  const isFiltered = !!type;

  const buildDatetime = (dateKey: string, timeKey: string): string | null => {
    const d = searchParams.get(dateKey);
    const t = searchParams.get(timeKey);
    if (!d || !t) return null;
    return tz ? toUtcIso(d, t, tz) : `${d}T${t}:00`;
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

  const filterOptions = useMemo(() => {
    const results = data?.results ?? [];
    return {
      makes: [...new Set(results.map((v) => v.make).filter(Boolean))].sort(),
      colors: [...new Set(results.map((v) => v.color).filter(Boolean))].sort(),
      seats: [...new Set(results.map((v) => v.seats).filter(Boolean))].sort((a, b) => a - b),
    };
  }, [data]);

  const clientFilterCount = activeFilterCount(filters);

  const vehicles = useMemo(() => {
    let list = [...(data?.results ?? [])];
    if (isFiltered) list = list.filter((v) => slugify(v.vehicleType ?? '') === type);
    list = list.filter((v) => {
      if (filters.make.length && !filters.make.includes(v.make)) return false;
      if (filters.color.length && !filters.color.includes(v.color)) return false;
      if (filters.seats.length && !filters.seats.includes(v.seats)) return false;
      if (filters.minPrice != null && v.pricePerDay < filters.minPrice) return false;
      if (filters.maxPrice != null && v.pricePerDay > filters.maxPrice) return false;
      return true;
    });
    if (sort === 'Price: low to high') list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === 'Price: high to low') list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    // Once the user has picked dates that meet the weekly threshold,
    // surface fleets with a weekly-discount tier first. Stable sort
    // (Array.prototype.sort in modern engines) means the rest of the
    // ordering — recommended / price / etc. — is preserved within the
    // two buckets.
    if (days >= 7) {
      list.sort((a, b) => weeklyDiscountPct(b) - weeklyDiscountPct(a));
    }
    return list;
  }, [data, sort, isFiltered, type, filters, days]);

  const fleetIds = useMemo(() => (data?.results ?? []).map((v) => v.id), [data]);
  const { data: availability } = useFleetAvailability(fleetIds, pickupDatetime, dropoffDatetime);
  const unavailableIds = useMemo(() => {
    const ids = new Set<string>();
    if (availability) for (const [id, ok] of Object.entries(availability)) if (ok === false) ids.add(id);
    return ids;
  }, [availability]);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clientFiltered = isFiltered || clientFilterCount > 0;
  const shown = clientFiltered ? vehicles.length : count;
  const countLabel = isLoading
    ? 'Loading…'
    : `Showing ${shown} ${shown === 1 ? 'car' : 'cars'} · prices for your ${days}-day trip${pct > 0 ? ` (${pct}% off daily)` : ''}`;

  const heading = isFiltered ? activeLabel : 'Pick your next ride from our fleet.';

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <SearchBar variant="compact" />

      <section className="mx-auto w-full max-w-[1200px] flex-1 px-6 pt-10 pb-[72px]">
        <FleetToolbar
          heading={heading}
          isFiltered={isFiltered}
          activeLabel={activeLabel}
          clearHref={paths.fleet}
          search={searchInput}
          onSearch={setSearchInput}
          searchPlaceholder="Search"
          sort={sort}
          sorts={SORTS}
          onSort={setSort}
          filters={filters}
          filterOptions={filterOptions}
          onFilters={setFilters}
          activeFilterCount={clientFilterCount}
        />

        {isError ? (
          <div className="rounded-2xl border border-card-border bg-subtle py-16 text-center text-sm text-muted">
            We couldn&apos;t load the fleet right now. Please try again shortly.
          </div>
        ) : isLoading ? (
          <div className="grid gap-x-[30px] gap-y-[34px] [grid-template-columns:repeat(auto-fill,minmax(228px,246px))]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[320px] animate-pulse rounded-[16px] border border-card-border bg-subtle" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-subtle py-16 text-center text-sm text-muted">
            No vehicles match your search right now.
          </div>
        ) : (
          <>
            <div className="grid gap-x-[30px] gap-y-[34px] [grid-template-columns:repeat(auto-fill,minmax(228px,246px))]">
              {vehicles.map((v) => {
                const unavailable = unavailableIds.has(v.id);
                const weeklyPct = weeklyDiscountPct(v);
                return (
                  <div key={v.id}>
                    <div className={cn(unavailable && 'pointer-events-none opacity-50')}>
                      <CarCard
                        vehicle={v}
                        badge={weeklyPct > 0 ? `${weeklyPct}% OFF WEEKLY` : undefined}
                      />
                    </div>
                    {unavailable && (
                      <div className="mt-2 text-center text-[11.5px] font-medium text-danger">
                        Unavailable for selected dates
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm text-faint">{countLabel}</span>
              {!clientFiltered && totalPages > 1 && (
                <FleetPagination page={page} totalPages={totalPages} onPage={goToPage} />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
