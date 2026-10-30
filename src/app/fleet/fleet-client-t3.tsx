'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CarCardT3 } from '@/components/fleet/car-card-t3';
import { Dyn } from '@/components/i18n/Dyn';
import { INITIAL_FILTERS } from '@/components/fleet/fleet-filters';
import { SearchBarT3 } from '@/components/search/search-bar-t3';
import { paths } from '@/lib/paths';
import { useFleetListing, SORTS } from './use-fleet-listing';
import { PlanPicker, RentalModelBar } from '@/components/fleet/rental-model-bar';

/** Template-3 fleet listing.
 *
 *  Follows the raw page: a toolbar with search and an icon button that
 *  opens a dark filter panel anchored to its right — not a row of
 *  category chips above the grid, which is what this had before and
 *  read as a different site. The panel carries the groups the raw
 *  design had (Type, Seats, Sort) with Reset / Show cars, and the
 *  button shows a dot while any filter is on.
 *
 *  Cards use the listing footer: trip total and a plain "View" link,
 *  rather than the home grid's filled "Reserve" button.
 *
 *  All state comes from useFleetListing — the hook templates 1 and 2
 *  use — so search, sort, filtering, paging and the availability
 *  check behave identically across templates. */
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
    selectedHours,
    rateView,
    unavailableIds,
    filters,
    setFilters,
    filterOptions,
    clientFilterCount,
    totalPages,
    goToPage,
    countLabel,
    heading,
    rentalTabs,
  } = useFleetListing();

  const [panelOpen, setPanelOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  // The panel is anchored to the toolbar, so a click anywhere else
  // closes it — otherwise it hangs over the grid being scrolled.
  useEffect(() => {
    if (!panelOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!toolsRef.current?.contains(e.target as Node)) setPanelOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [panelOpen]);

  const fleetPage = tenant.sections.fleet_page;
  const hours = selectedHours ?? 0;
  const days = hours > 0 ? Math.max(1, Math.ceil(hours / 24)) : 0;

  function toggleType(value: string) {
    setFilters({
      ...filters,
      vehicleType: filters.vehicleType.includes(value)
        ? filters.vehicleType.filter((v) => v !== value)
        : [...filters.vehicleType, value],
    });
  }

  function toggleSeat(value: number) {
    setFilters({
      ...filters,
      seats: filters.seats.includes(value)
        ? filters.seats.filter((v) => v !== value)
        : [...filters.seats, value],
    });
  }

  return (
    <>
      <div className="sbar dark">
        <div className="wrap">
          <SearchBarT3 variant="inline" model={rentalTabs.active} />
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

            <div className="fl-tools" ref={toolsRef}>
              <label className="srch">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search make, model or type"
                  aria-label="Search the fleet"
                />
              </label>

              <button
                type="button"
                className={clientFilterCount > 0 ? 'ibtn has' : 'ibtn'}
                aria-expanded={panelOpen}
                aria-label="Filters"
                onClick={() => setPanelOpen((v) => !v)}
              >
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M2 4h14M4.5 9h9M7 14h4" stroke="currentColor" strokeWidth="1.6" fill="none" />
                </svg>
                <i className="dot" />
              </button>

              <div className={panelOpen ? 'fpanel on' : 'fpanel'}>
                {filterOptions.vehicleTypes.length > 0 ? (
                  <div className="grp">
                    <h4><Dyn>Type</Dyn></h4>
                    <div className="row">
                      {filterOptions.vehicleTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          className="fchip"
                          aria-pressed={filters.vehicleType.includes(type)}
                          onClick={() => toggleType(type)}
                        >
                          <Dyn>{type}</Dyn>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {filterOptions.seats.length > 0 ? (
                  <div className="grp">
                    <h4><Dyn>Seats</Dyn></h4>
                    <div className="row">
                      {filterOptions.seats.map((seat) => (
                        <button
                          key={seat}
                          type="button"
                          className="fchip"
                          aria-pressed={filters.seats.includes(seat)}
                          onClick={() => toggleSeat(seat)}
                        >
                          {seat}+
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grp">
                  <h4><Dyn>Sort</Dyn></h4>
                  <div className="row">
                    {SORTS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="fchip"
                        aria-pressed={sort === option}
                        onClick={() => setSort(option)}
                      >
                        <Dyn>{option}</Dyn>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="acts">
                  <button type="button" className="lnk" onClick={() => setFilters(INITIAL_FILTERS)}>
                    <Dyn>Reset</Dyn>
                  </button>
                  <button type="button" className="btn" onClick={() => setPanelOpen(false)}>
                    <Dyn>Show cars</Dyn>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <RentalModelBar state={rentalTabs} />

          {rentalTabs.showPlans ? (
            <PlanPicker plans={rentalTabs.plans} />
          ) : rentalTabs.modelOff ? null : isLoading ? (
            <p className="count"><Dyn>Loading the fleet…</Dyn></p>
          ) : isError ? (
            <p className="count"><Dyn>The fleet could not be loaded. Please try again.</Dyn></p>
          ) : vehicles.length === 0 ? (
            <div className="empty">
              <h3><Dyn>{rentalTabs.emptyText ?? 'No cars match'}</Dyn></h3>
              <p><Dyn>Try a different search or clear your filters.</Dyn></p>
              <button type="button" className="btn ghost" onClick={() => setFilters(INITIAL_FILTERS)}>
                <Dyn>Clear filters</Dyn>
              </button>
            </div>
          ) : (
            <div className="cars">
              {vehicles.map((vehicle) => (
                <CarCardT3
                  key={vehicle.id}
                  vehicle={vehicle}
                  bookingQuery={bookingQuery}
                  unavailable={unavailableIds.has(vehicle.id)}
                  variant="view"
                  totalPrice={days > 0 ? Number(vehicle.pricePerDay) * days : undefined}
                  days={days}
                  view={rateView}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="pager">
              <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <Dyn>Previous</Dyn>
              </button>
              <span>{page} / {totalPages}</span>
              <button type="button" className="btn ghost" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                <Dyn>Next</Dyn>
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
