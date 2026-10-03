'use client';

import { todayISO } from '@/lib/time-slots';
import { DateTimeField } from './date-time-field';
import { Dyn } from '@/components/i18n/Dyn';
import { MapPin, ChevronDown } from '@/components/ui/icons';
import { useSearchBar } from './use-search-bar';
import styles from '@/styles/template-2.module.css';

interface SearchBarT2Props {
  /** ``hero`` floats the bar over the hero with a negative offset (the
   *  mockup's signature overlap); ``inline`` sits in normal flow for
   *  the fleet listing page. */
  variant?: 'hero' | 'inline';
}

/** Template-2 booking bar — the mockup's own design (mono uppercase
 *  labels over underlined fields, brass submit spanning the grid), not
 *  the template-1 card. All state and the submit/embed behaviour come
 *  from the shared useSearchBar hook, so both templates stay in step. */
export function SearchBarT2({ variant = 'hero' }: SearchBarT2Props) {
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
    openLoc,
    setOpenLoc,
    selectedPickup,
    selectedDrop,
    minTime,
    maxTime,
    handlePickupDate,
    showDisc,
    discTitle,
    goSearch,
  } = useSearchBar();

  const locationField = (which: 'pickup' | 'drop') => {
    const selected = which === 'pickup' ? selectedPickup : selectedDrop;
    const list = which === 'pickup' ? pickupLocations : dropoffLocations;
    const open = openLoc === which;
    const activeId = which === 'pickup' ? pickupLocId : dropLocId;

    return (
      <div className={styles.bookingLoc}>
        <button
          type="button"
          onClick={() => setOpenLoc(open ? null : which)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={styles.bookingLocBtn}
        >
          <MapPin size={15} />
          <span className={styles.bookingLocName}>
            {selected?.name ?? <Dyn>Select location</Dyn>}
          </span>
          <ChevronDown size={13} />
        </button>
        {open ? (
          <div role="listbox" className={styles.bookingLocPanel}>
            {list.length === 0 ? (
              <p className={styles.bookingLocEmpty}>
                <Dyn>No locations available</Dyn>
              </p>
            ) : (
              list.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  role="option"
                  aria-selected={loc.id === activeId}
                  onClick={() => {
                    if (which === 'pickup') setPickupLocId(loc.id);
                    else setDropLocId(loc.id);
                    setOpenLoc(null);
                  }}
                  className={styles.bookingLocOption}
                >
                  <span>{loc.name}</span>
                  {loc.address ? <small>{loc.address}</small> : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.bookingWrap} ${variant === 'hero' ? styles.bookingWrapHero : ''}`}
    >
      <form
        className={styles.booking}
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
      >
        <div className={`${styles.bookingField} ${styles.bookingFieldLoc}`}>
          <label>
            <Dyn>{diffLocation ? 'Pick-up location' : 'Pick-up & return'}</Dyn>
          </label>
          {locationField('pickup')}
        </div>

        {diffLocation ? (
          <div className={`${styles.bookingField} ${styles.bookingFieldLoc}`}>
            <label>
              <Dyn>Drop-off location</Dyn>
            </label>
            {locationField('drop')}
          </div>
        ) : null}

        <div className={styles.bookingField}>
          <label>
            <Dyn>Pick-up</Dyn>
          </label>
          <div className={styles.bookingSubrow}>
            <DateTimeField
              date={pickupDate}
              time={pickupTime}
              onDate={handlePickupDate}
              onTime={setPickupTime}
              minDate={todayISO()}
              minTime={minTime}
              maxTime={maxTime}
            />
          </div>
        </div>

        <div className={styles.bookingField}>
          <label>
            <Dyn>Return</Dyn>
          </label>
          <div className={styles.bookingSubrow}>
            <DateTimeField
              date={returnDate}
              time={returnTime}
              onDate={setReturnDate}
              onTime={setReturnTime}
              minDate={pickupDate || todayISO()}
              highlightDate={pickupDate}
            />
          </div>
        </div>

        <button type="submit" className={`${styles.btn} ${styles.btnBrass} ${styles.bookingSubmit}`}>
          <Dyn>Search the fleet</Dyn>
        </button>

        <label className={styles.bookingDiff}>
          <input
            type="checkbox"
            checked={diffLocation}
            onChange={(e) => setDiffLocation(e.target.checked)}
          />
          <span>
            <Dyn>Return car to a different location</Dyn>
          </span>
        </label>
      </form>

      {showDisc ? (
        <p className={styles.bookingNote}>
          <Dyn>{discTitle}</Dyn>
        </p>
      ) : null}
    </div>
  );
}
