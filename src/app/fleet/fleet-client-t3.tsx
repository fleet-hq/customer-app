'use client';

import Link from 'next/link';
import { CarCardT3 } from '@/components/fleet/car-card-t3';
import { Dyn } from '@/components/i18n/Dyn';
import { SearchBarT3 } from '@/components/search/search-bar-t3';
import { useFleetListing, SORTS } from './use-fleet-listing';
import { paths } from '@/lib/paths';

/** Template-3 fleet listing.
 *
 *  Every piece of state — search, sort, filters, pagination, the
 *  availability check driven by the booking bar — comes from
 *  useFleetListing, the same hook templates 1 and 2 use. This file is
 *  only the raw mockup's markup around it.
 *
 *  The raw page's filter panel listed fixed SUV/Sedan/Van/Electric and
 *  seat buckets; the real options come from the tenant's own fleet via
 *  `filterOptions`, so they always match what can be rented. */
export default function FleetClientT3() {
  const {
    tenant,
    sort,
    setSort,
    searchInput,
    setSearchInput,
    page,
    isLoading,
    isError,
    vehicles,
    bookingQuery,
    unavailableIds,
    filters,
    setFilters,
    filterOptions,
    totalPages,
    goToPage,
    countLabel,
    heading,
  } = useFleetListing();

  const fleetPage = tenant.sections.fleet_page;
  const types = filterOptions.vehicleTypes;

  const toggleType = (type: string) => {
    const current = filters.vehicleType;
    setFilters({
      ...filters,
      vehicleType: current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    });
  };

  return (
    <>
      <div className="sbar dark">
        <div className="wrap">
          <SearchBarT3 variant="inline" />
        </div>
      </div>

      <main className="pg">
        <div className="wrap">
          <div className="fl-top">
            <div>
              <Link className="crumb" href={paths.home}>
                ‹ <Dyn>Home</Dyn>
              </Link>
              <h1>
                <Dyn>{fleetPage?.heading || heading}</Dyn>
              </h1>
              {countLabel ? <p className="count">{countLabel}</p> : null}
            </div>

            <div className="fl-tools">
              <label className="srch">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search make, model or type"
                  aria-label="Search the fleet"
                />
              </label>
              <select
                className="fsort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort the fleet"
              >
                {SORTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {types.length > 1 ? (
            <div className="chips" role="group" aria-label="Filter by type">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="chip"
                  aria-pressed={filters.vehicleType.includes(type)}
                  onClick={() => toggleType(type)}
                >
                  <Dyn>{type}</Dyn>
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <p className="count">
              <Dyn>Loading the fleet…</Dyn>
            </p>
          ) : isError ? (
            <p className="count">
              <Dyn>The fleet could not be loaded. Please try again.</Dyn>
            </p>
          ) : vehicles.length === 0 ? (
            <p className="count">
              <Dyn>No cars match those filters.</Dyn>
            </p>
          ) : (
            <div className="cars">
              {vehicles.map((vehicle) => (
                <CarCardT3
                  key={vehicle.id}
                  vehicle={vehicle}
                  bookingQuery={bookingQuery}
                  unavailable={unavailableIds.has(vehicle.id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="pager">
              <button
                type="button"
                className="btn ghost"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <Dyn>Previous</Dyn>
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn ghost"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                <Dyn>Next</Dyn>
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
