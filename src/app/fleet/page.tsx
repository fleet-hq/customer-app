'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SearchBar } from '@/components/search/search-bar';
import { CarCard } from '@/components/fleet/car-card';
import { Pagination } from '@/components/fleet/pagination';
import { ChevronDown } from '@/components/ui/icons';
import { useTenant } from '@/lib/tenant-context';
import { defaultLocation } from '@/lib/tenant';
import { useFleets, useFleetAvailability } from '@/hooks';
import { useDefaultLocation } from '@/contexts';
import { toUtcIso } from '@/utils/datetime';
import { cn } from '@/lib/utils';

const SORTS = ['Recommended', 'Price: low to high', 'Price: high to low'] as const;
const PAGE_SIZE = 9;

export default function FleetPage() {
  const tenant = useTenant();
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number]>(SORTS[0]);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useFleets(page, '', PAGE_SIZE);

  const searchParams = useSearchParams();
  const tz = useDefaultLocation()?.timezone ?? null;
  const searchedLocation = searchParams.get('pickupLocation') ?? defaultLocation(tenant).name;

  const buildDatetime = (dateKey: string, timeKey: string): string | null => {
    const d = searchParams.get(dateKey);
    const t = searchParams.get(timeKey);
    if (!d || !t) return null;
    return tz ? toUtcIso(d, t, tz) : `${d}T${t}:00`;
  };
  const pickupDatetime = useMemo(() => buildDatetime('pickupDate', 'pickupTime'), [searchParams, tz]);
  const dropoffDatetime = useMemo(() => buildDatetime('returnDate', 'returnTime'), [searchParams, tz]);

  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const vehicles = useMemo(() => {
    const list = [...(data?.results ?? [])];
    if (sort === 'Price: low to high') list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === 'Price: high to low') list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    return list;
  }, [data, sort]);

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

  return (
    <div className="bg-white text-ink">
      <Header active="Fleet" />
      <SearchBar variant="compact" />

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">Available vehicles</h1>
            <p className="mt-[5px] text-[13.5px] text-faint">
              {isLoading ? 'Loading…' : `${count} ${count === 1 ? 'car' : 'cars'} · ${searchedLocation}`}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 rounded-[9px] border border-line bg-white px-4 py-[10px] text-[13px] font-medium text-ink"
            >
              <span className="text-faint">Sort:</span>
              {sort}
              <ChevronDown size={14} className="text-faint" />
            </button>
            {sortOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 z-40 w-[210px] rounded-[11px] border border-line bg-white p-[6px] shadow-[var(--shadow-pop)]">
                {SORTS.map((s) => (
                  <div
                    key={s}
                    onClick={() => {
                      setSort(s);
                      setSortOpen(false);
                    }}
                    className={cn(
                      'cursor-pointer rounded-lg px-[11px] py-[9px] text-[13px]',
                      s === sort ? 'bg-primary-soft font-semibold text-secondary' : 'text-label hover:bg-primary-soft hover:text-secondary',
                    )}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isError ? (
          <div className="mt-10 rounded-2xl border border-card-border bg-subtle py-16 text-center text-sm text-muted">
            We couldn&apos;t load the fleet right now. Please try again shortly.
          </div>
        ) : isLoading ? (
          <div className="mt-7 flex flex-wrap gap-[18px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[300px] w-[246px] animate-pulse rounded-[16px] border border-card-border bg-subtle" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-card-border bg-subtle py-16 text-center text-sm text-muted">
            No vehicles are available right now.
          </div>
        ) : (
          <>
            <div className="mt-7 flex flex-wrap gap-[18px]">
              {vehicles.map((v) => {
                const unavailable = unavailableIds.has(v.id);
                return (
                  <div key={v.id} className="w-[246px]">
                    <div className={cn(unavailable && 'pointer-events-none opacity-50')}>
                      <CarCard vehicle={v} />
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

            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalResults={count}
                  resultsPerPage={PAGE_SIZE}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
