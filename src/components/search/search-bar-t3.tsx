'use client';

import { Dyn } from '@/components/i18n/Dyn';
import { useSearchBar } from './use-search-bar';
import { useTenantToday } from '@/hooks/use-tenant-today';

/** Template-3 booking form — the raw template's own markup (boxed
 *  fields on the dark hero, a checkbox for a different return
 *  location). Every piece of state and the submit behaviour come from
 *  the shared useSearchBar hook, so all three templates search
 *  identically and only the presentation differs. */
export function SearchBarT3({ variant = 'hero' }: { variant?: 'hero' | 'inline' }) {
  const today = useTenantToday();
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
            <Dyn>Pick-up &amp; return</Dyn>
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

        {diffLocation ? (
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

        <div className="field">
          <label htmlFor="t3-rd">
            <Dyn>Return</Dyn>
          </label>
          <div className="pair">
            <span className="inp">
              <input
                type="date"
                id="t3-rd"
                required
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

        <div className="book-go">
          <label className="toggle">
            <input
              type="checkbox"
              checked={diffLocation}
              onChange={(e) => setDiffLocation(e.target.checked)}
            />
            <Dyn>Return car to a different location</Dyn>
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
