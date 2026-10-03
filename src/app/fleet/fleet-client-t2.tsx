'use client';

import { CarCardT2 } from '@/components/fleet/car-card-t2';
import { SearchBarT2 } from '@/components/search/search-bar-t2';
import { FleetFiltersT2 } from '@/components/fleet/fleet-filters-t2';
import { FaqT2 } from '@/components/sections/home-t2/faq-t2';
import { NapBlockT2 } from '@/components/sections/shared/nap-block-t2';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useFleetListing, SORTS, applicableDiscountPct } from './use-fleet-listing';
import styles from '@/styles/template-2.module.css';

export default function FleetClientT2() {
  const {
    tenant,
    t,
    sort,
    setSort,
    searchInput,
    setSearchInput,
    page,
    isLoading,
    isError,
    isAvailabilityLoading,
    vehicles,
    bookingQuery,
    selectedHours,
    unavailableIds,
    filters,
    setFilters,
    filterOptions,
    clientFilterCount,
    totalPages,
    goToPage,
    countLabel,
    heading,
    isFiltered,
  } = useFleetListing();

  const fleetPage = tenant.sections.fleet_page;

  return (
    <div className={styles.section}>
      {/* Same booking bar as the home hero: picking dates here is what
       *  drives the availability check, so cars already reserved for
       *  the chosen window come back flagged as unavailable. */}
      <SearchBarT2 variant="inline" />

      <div className={styles.container}>
        {!isFiltered && fleetPage && (fleetPage.heading || (fleetPage.intro?.length ?? 0) > 0) ? (
          <div className={styles.pageHead}>
            {fleetPage.eyebrow ? (
              <p className={styles.eyebrow}>
                <Dyn>{fleetPage.eyebrow}</Dyn>
              </p>
            ) : null}
            {fleetPage.heading ? (
              <h1>
                <Dyn>{fleetPage.heading}</Dyn>
              </h1>
            ) : null}
            {fleetPage.intro?.length ? (
              <div className={styles.pageIntro}>
                {fleetPage.intro.map((p, i) => (
                  <p key={i}>
                    <Dyn>{p}</Dyn>
                  </p>
                ))}
              </div>
            ) : null}
            {fleetPage.includes?.length ? (
              <ul className={styles.pageIncludes}>
                {fleetPage.includes_title ? (
                  <p className={styles.pageIncludesTitle}>
                    <Dyn>{fleetPage.includes_title}</Dyn>
                  </p>
                ) : null}
                {fleetPage.includes.map((b, i) => (
                  <li key={i}>
                    <Dyn>{b}</Dyn>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className={styles.toolbar}>
          <h2 className={styles.toolbarHeading}>{heading}</h2>
          <div className={styles.toolbarRight}>
            {isFiltered ? (
              <a href={paths.fleet} className={styles.clearFilter}>
                <Dyn>Clear filter</Dyn>
              </a>
            ) : null}
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('Search')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select className={styles.selectInput} value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <FleetFiltersT2
          filters={filters}
          options={filterOptions}
          onChange={setFilters}
          activeCount={clientFilterCount}
        />

        {isError ? (
          <div className={styles.emptyState}>
            <Dyn>We couldn&apos;t load the fleet right now. Please try again shortly.</Dyn>
          </div>
        ) : isLoading ? (
          <div className={styles.fleetGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className={styles.emptyState}>
            <Dyn>No vehicles match your search right now.</Dyn>
          </div>
        ) : (
          <>
            <div className={styles.fleetGrid}>
              {vehicles.map((v) => (
                <CarCardT2
                  key={v.id}
                  vehicle={v}
                  bookingQuery={bookingQuery}
                  hours={selectedHours}
                  discountPct={applicableDiscountPct(v.discounts, selectedHours)}
                  unavailable={unavailableIds.has(v.id) || isAvailabilityLoading}
                />
              ))}
            </div>

            <div className={styles.countRow}>
              <span className={styles.countLabel}>{countLabel}</span>
              {totalPages > 1 ? (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.pageBtn} ${page === i + 1 ? styles.pageBtnActive : ''}`}
                      onClick={() => goToPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {!isFiltered && fleetPage?.faqs?.length ? (
        <FaqT2 title={t('Fleet Questions')} items={fleetPage.faqs} />
      ) : null}

      {!isFiltered && fleetPage ? (
        <div className={styles.container}>
          <NapBlockT2 tenant={tenant} />
        </div>
      ) : null}
    </div>
  );
}
