'use client';

import { useState } from 'react';

import { Dyn } from '@/components/i18n/Dyn';
import { useSearchBar } from './use-search-bar';
import { useTenantToday } from '@/hooks/use-tenant-today';
import { useRentalSiteConfig } from '@/hooks/useRentalSiteConfig';
import { RENTAL_TABS, tabFor } from '@/lib/rental-tabs';
import type { RentalModel } from '@/services/rentalServices';

/** Template-3 booking form — the raw template's own markup (boxed
 *  fields on the dark hero, a checkbox for a different return
 *  location). Every piece of state and the submit behaviour come from
 *  the shared useSearchBar hook, so all three templates search
 *  identically and only the presentation differs. */
export function SearchBarT3({
  variant = 'hero',
  model = 'daily',
  onModelChange,
}: {
  variant?: 'hero' | 'inline';
  model?: RentalModel;
  onModelChange?: (next: RentalModel) => void;
}) {
  const today = useTenantToday();
  const [wantsReturn, setWantsReturn] = useState(false);
  const rentalConfig = useRentalSiteConfig();
  const ongoing = model !== 'daily';
  const tab = tabFor(model);
  const minWeeks = ongoing ? rentalConfig.terms?.[model]?.min_term_weeks ?? 0 : 0;
  const returnShown = !ongoing || wantsReturn;
  const splitTabs = onModelChange
    ? RENTAL_TABS.filter((entry) => rentalConfig.bookableModels.includes(entry.model))
    : [];
  const {
    rootRef,
    pickupLocations,
    dropoffLocations,
    pickupLocId,
    setPickupLocId,
    dropLocId,
    setDropLocId,
    pickupDate,
    returnDate,
    setReturnDate,
    pickupTime,
    setPickupTime,
    returnTime,
    setReturnTime,
    diffLocation,
    setDiffLocation,
    maxTime,
    handlePickupDate,
    showDisc,
    discTitle,
    goSearch,
  } = useSearchBar();

  return (
    <div className={variant === 'hero' ? 'booking' : 'booking inline'} id="book" ref={rootRef}>
      {splitTabs.length > 1 ? (
        <div
          className="ftabs"
          role="tablist"
          aria-label="Rental type"
          style={{ gridTemplateColumns: `repeat(${splitTabs.length}, minmax(0, 1fr))` }}
        >
          {splitTabs.map((entry) => (
            <button
              key={entry.model}
              className="ftab"
              type="button"
              role="tab"
              aria-selected={entry.model === model}
              onClick={() => onModelChange?.(entry.model)}
            >
              <b>
                <Dyn>{entry.label}</Dyn>
              </b>
              <span>
                <Dyn>{entry.blurb}</Dyn>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <form
        className="book"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
      >
        <div className="book-hd">
          <i />
          <span className="eyebrow">
            <Dyn>{tab.fieldsLabel}</Dyn>
          </span>
        </div>

        <div className="field">
          <label htmlFor="t3-loc">
            <Dyn>Location</Dyn>
          </label>
          <select
            id="t3-loc"
            required
            value={pickupLocId}
            onChange={(e) => setPickupLocId(e.target.value)}
          >
            <option value="">Select location</option>
            {pickupLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {!ongoing && diffLocation ? (
          <div className="drop field">
            <label htmlFor="t3-dloc">
              <Dyn>Return location</Dyn>
            </label>
            <select
              id="t3-dloc"
              value={dropLocId}
              onChange={(e) => setDropLocId(e.target.value)}
            >
              <option value="">Select location</option>
              {dropoffLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="t3-pd">
            <Dyn>Pick-up</Dyn>
          </label>
          <div className="pair">
            <span className="inp">
              <input
                type="date"
                id="t3-pd"
                required
                value={pickupDate}
                min={today}
                onChange={(e) => handlePickupDate(e.target.value)}
              />
            </span>
            <span className="inp t">
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              />
            </span>
          </div>
        </div>

        {returnShown ? (
        <div className="field">
          <label htmlFor="t3-rd">
            <Dyn>Return</Dyn>
          </label>
          <div className="pair">
            <span className="inp">
              <input
                type="date"
                id="t3-rd"
                required={returnShown}
                value={returnDate}
                min={pickupDate || today}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </span>
            <span className="inp t">
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
              />
            </span>
          </div>
        </div>
        ) : null}

        <div className="book-go">
          <label className="toggle">
            <input
              type="checkbox"
              checked={ongoing ? wantsReturn : diffLocation}
              onChange={(e) => (ongoing ? setWantsReturn(e.target.checked) : setDiffLocation(e.target.checked))}
            />
            <Dyn>
              {ongoing
                ? minWeeks > 0
                  ? `Add a return date (${minWeeks}-week minimum)`
                  : 'Add a return date'
                : 'Return car to a different location'}
            </Dyn>
          </label>
          <button className="btn" type="submit">
            <Dyn>Search the fleet</Dyn> <span className="chev">›</span>
          </button>
        </div>

        {showDisc && discTitle ? (
          <div className="book-msg" role="status">
            {discTitle}
          </div>
        ) : null}
      </form>
    </div>
  );
}
