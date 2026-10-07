'use client';

import { SearchBar } from '@/components/search/search-bar';
import { CarCard } from '@/components/fleet/car-card';
import { FleetToolbar } from '@/components/fleet/fleet-toolbar';
import { FleetPagination } from '@/components/fleet/fleet-pagination';
import { paths } from '@/lib/paths';
import { cn } from '@/lib/utils';
import { ContentFaq } from '@/components/sections/content/content-faq';
import { NapBlock } from '@/components/sections/shared/nap-block';
import { Dyn } from '@/components/i18n/Dyn';
import { useFleetListing, SORTS, applicableDiscountPct } from './use-fleet-listing';
import FleetClientT2 from './fleet-client-t2';

const FLEET_GRID_CLASS =
  'grid gap-x-4 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:gap-x-[30px] lg:gap-y-[34px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

export default function FleetClient() {
  const {
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
    hasAvailabilityWindow,
    totalPages,
    goToPage,
    countLabel,
    heading,
    isFiltered,
    activeLabel,
  } = useFleetListing();

  if (tenant.websiteTemplate === 'template_2') {
    return <FleetClientT2 />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <SearchBar variant="compact" />

      <section className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-12 sm:px-6 sm:pt-10 sm:pb-18">
        {!isFiltered && tenant.sections.fleet_page &&
        (tenant.sections.fleet_page.heading || (tenant.sections.fleet_page.intro?.length ?? 0) > 0) ? (
          <div className="mb-8 flex flex-col gap-4 border-b border-hairline pb-8">
            {tenant.sections.fleet_page.eyebrow ? (
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-primary">
                {tenant.sections.fleet_page.eyebrow}
              </span>
            ) : null}
            {tenant.sections.fleet_page.heading ? (
              <h1 className="font-manrope text-[26px] font-bold leading-[1.2] tracking-[-0.01em] text-ink text-balance sm:text-[32px]">
                {tenant.sections.fleet_page.heading}
              </h1>
            ) : null}
            {tenant.sections.fleet_page.intro?.length ? (
              <div className="flex max-w-[760px] flex-col gap-2">
                {tenant.sections.fleet_page.intro.map((p, i) => (
                  <p key={i} className="text-[15px] leading-[1.7] text-muted">
                    {p}
                  </p>
                ))}
              </div>
            ) : null}
            {tenant.sections.fleet_page.includes?.length ? (
              <div className="mt-1">
                {tenant.sections.fleet_page.includes_title ? (
                  <p className="mb-2 text-[13px] font-semibold text-ink">
                    {tenant.sections.fleet_page.includes_title}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-[7px]">
                  {tenant.sections.fleet_page.includes.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[14px] leading-[1.6] text-label">
                      <span className="mt-[8px] h-[5px] w-[5px] flex-shrink-0 rounded-full bg-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <FleetToolbar
          heading={heading}
          isFiltered={isFiltered}
          activeLabel={activeLabel}
          clearHref={paths.fleet}
          search={searchInput}
          onSearch={setSearchInput}
          searchPlaceholder={t('Search')}
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
            <Dyn>We couldn&apos;t load the fleet right now. Please try again shortly.</Dyn>
          </div>
        ) : isLoading ? (
          <div className={FLEET_GRID_CLASS}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[320px] animate-pulse rounded-[16px] border border-card-border bg-subtle" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-subtle py-16 text-center text-sm text-muted">
            <Dyn>No vehicles match your search right now.</Dyn>
          </div>
        ) : (
          <>
            <div className={FLEET_GRID_CLASS}>
              {vehicles.map((v) => {
                const unavailable = unavailableIds.has(v.id);
                const discountPct = applicableDiscountPct(v.discounts, selectedHours);
                return (
                  <div key={v.id} className="relative flex h-full flex-col">
                    <div className={cn('flex-1', (unavailable || isAvailabilityLoading) && 'pointer-events-none opacity-60')}>
                      <CarCard
                        vehicle={v}
                        bookingQuery={bookingQuery}
                        hours={selectedHours}
                        discountPct={discountPct}
                      />
                    </div>
                    {unavailable ? (
                      <span className="pointer-events-none absolute top-[10px] right-[10px] rounded-full border border-danger/25 bg-white/95 px-[10px] py-[3px] text-[10px] font-semibold tracking-[0.02em] text-danger shadow-sm">
                        <Dyn>Unavailable</Dyn>
                      </span>
                    ) : hasAvailabilityWindow && !isAvailabilityLoading ? (
                      <span className="pointer-events-none absolute top-[10px] right-[10px] rounded-full border border-success/25 bg-white/95 px-[10px] py-[3px] text-[10px] font-semibold tracking-[0.02em] text-success shadow-sm">
                        <Dyn>Available</Dyn>
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-between">
              <span className="text-center text-sm text-faint sm:text-left">{countLabel}</span>
              {totalPages > 1 && (
                <FleetPagination page={page} totalPages={totalPages} onPage={goToPage} />
              )}
            </div>
          </>
        )}

        {!isFiltered && tenant.sections.fleet_page?.faqs?.length ? (
          <div className="mt-12 border-t border-hairline pt-10">
            <ContentFaq title={t('Fleet Questions')} items={tenant.sections.fleet_page.faqs} />
          </div>
        ) : null}

        {!isFiltered && tenant.sections.fleet_page ? (
          <div className="mt-10">
            <NapBlock tenant={tenant} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
