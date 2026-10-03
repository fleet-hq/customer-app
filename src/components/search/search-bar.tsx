'use client';

import { todayISO } from '@/lib/time-slots';
import { cn } from '@/lib/utils';
import { useSearchBar } from './use-search-bar';
import { ArrowRight, Check, ChevronDown, MapPin, Search, Swap } from '@/components/ui/icons';
import { DateTimeField } from './date-time-field';
import { Dyn } from '@/components/i18n/Dyn';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  /** Drop the outer white card (background / border / shadow / padding).
   *  Used by the widget /search route embedded on partner sites — those
   *  partners style their own container in Webflow/Wix/etc., so the
   *  extra card would double up. Off by default so kaysgroove et al.
   *  still get the standard hero card. */
  bareContainer?: boolean;
}

export function SearchBar({ variant = 'hero', bareContainer = false }: SearchBarProps) {
  const { t } = useDynamicTranslation(['Swap locations', "You've unlocked our best weekly rate."]);
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
    days,
    showDisc,
    earnedWeekly,
    bestWeeklyPct,
    discTitle,
    discSub,
    goSearch,
  } = useSearchBar();

  const LocationField = ({ which }: { which: 'pickup' | 'drop' }) => {
    const selected = which === 'pickup' ? selectedPickup : selectedDrop;
    const value = selected?.name ?? '';
    const list = which === 'pickup' ? pickupLocations : dropoffLocations;
    const open = openLoc === which;
    return (
      <div className="relative min-w-0 flex-[1.3]">
        <div className="mb-[6px] text-[10px] tracking-[0.03em] text-faint uppercase">
          {which === 'pickup' ? <Dyn>Pick-up</Dyn> : <Dyn>Drop-off</Dyn>}
        </div>
        <button
          type="button"
          onClick={() => setOpenLoc(open ? null : which)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-[9px] bg-transparent text-left"
        >
          <MapPin size={16} className="flex-shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
            {value || <span className="text-placeholder"><Dyn>Select location</Dyn></span>}
          </span>
          <ChevronDown size={13} className="flex-shrink-0 text-faint" />
        </button>
        {open && (
          <div role="listbox" className="absolute top-full right-0 left-0 z-40 mt-[10px] max-h-[260px] overflow-y-auto rounded-[11px] border border-line bg-white p-[6px] shadow-[var(--shadow-pop)]">
            {list.length === 0 ? (
              <div className="px-[11px] py-[10px] text-[13px] text-faint"><Dyn>No locations available</Dyn></div>
            ) : (
              list.map((loc) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={loc.id === (which === 'pickup' ? pickupLocId : dropLocId)}
                  key={loc.id}
                  onClick={() => {
                    which === 'pickup' ? setPickupLocId(loc.id) : setDropLocId(loc.id);
                    setOpenLoc(null);
                  }}
                  className="flex w-full cursor-pointer items-start gap-[9px] rounded-lg px-[11px] py-[10px] text-left text-[13.5px] whitespace-nowrap text-label hover:bg-primary-soft hover:text-secondary"
                >
                  <MapPin size={15} className="mt-px flex-shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate">{loc.name}</span>
                    {loc.address && <span className="block truncate text-[11.5px] text-faint">{loc.address}</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div ref={rootRef} className="w-full border-b border-hairline bg-subtle">
        <div className="mx-auto max-w-[1200px] px-6 py-[12px]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
            <LocationField which="pickup" />
            <div
              aria-hidden={!diffLocation}
              className={cn(
                'flex items-center transition-all duration-300 ease-out',
                diffLocation
                  ? 'w-full gap-2 overflow-visible opacity-100 md:w-auto md:max-w-[360px] md:flex-[1.1]'
                  : 'hidden overflow-hidden opacity-0 md:flex md:max-w-0 md:flex-[0_0_0px] md:gap-0 md:opacity-0 pointer-events-none',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setPickupLocId(dropLocId);
                  setDropLocId(pickupLocId);
                }}
                title={t('Swap locations')}
                aria-label={t('Swap locations')}
                className="flex flex-shrink-0 cursor-pointer items-center justify-center bg-transparent p-1 text-primary"
              >
                <Swap size={16} />
              </button>
              <LocationField which="drop" />
            </div>
            <div className="mx-[9px] hidden h-[38px] w-px flex-shrink-0 bg-line md:block" />
            <div className="min-w-0 flex-[1.55]">
              <div className="mb-[5px] text-[10px] tracking-[0.03em] text-faint uppercase"><Dyn>Pick-up Date &amp; Time</Dyn></div>
              <DateTimeField
                date={pickupDate}
                time={pickupTime}
                onDate={handlePickupDate}
                onTime={setPickupTime}
                minTime={minTime}
                maxTime={maxTime}
                minDate={todayISO()}
                label="Pick-up"
                compact
              />
            </div>
            <div className="mx-[9px] hidden h-[38px] w-px flex-shrink-0 bg-line md:block" />
            <div className="min-w-0 flex-[1.55]">
              <div className="mb-[5px] text-[10px] tracking-[0.03em] text-faint uppercase"><Dyn>Return Date &amp; Time</Dyn></div>
              <DateTimeField
                date={returnDate}
                time={returnTime}
                onDate={setReturnDate}
                onTime={setReturnTime}
                minTime={minTime}
                maxTime={maxTime}
                minDate={pickupDate || todayISO()}
                highlightDate={pickupDate}
                label="Return"
                compact
              />
            </div>
            <button
              onClick={goSearch}
              className="flex h-[42px] w-full flex-shrink-0 items-center justify-center gap-2 rounded-[9px] border border-line bg-white text-[13px] font-semibold text-primary md:ml-2 md:w-[42px]"
            >
              <Search size={17} />
              <span className="md:hidden"><Dyn>Search</Dyn></span>
            </button>
          </div>
          <label
            onClick={() => {
              setDiffLocation((d) => !d);
              setOpenLoc(null);
            }}
            className="mt-[10px] inline-flex cursor-pointer items-center gap-[9px] text-[12.5px] text-label"
          >
            <span
              className={cn(
                'inline-flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                diffLocation ? 'border-primary bg-primary' : 'border-control bg-white',
              )}
            >
              {diffLocation && <Check size={11} strokeWidth={3} className="text-white" />}
            </span>
            <Dyn>Return car to different location</Dyn>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="w-full">
      <div
        className={cn(
          bareContainer
            ? 'rounded-xl border border-card-border px-5 pt-5 pb-4 md:px-8 md:pt-6'
            : 'rounded-xl border border-card-border bg-white px-5 pt-5 pb-4 shadow-[var(--shadow-card)] md:px-8 md:pt-6',
        )}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-3">
          <LocationField which="pickup" />
          <div
            aria-hidden={!diffLocation}
            className={cn(
              'flex items-center transition-all duration-300 ease-out',
              diffLocation
                ? 'w-full gap-2 overflow-visible opacity-100 md:w-auto md:max-w-[460px] md:flex-[1.6]'
                : 'hidden overflow-hidden opacity-0 md:flex md:max-w-0 md:flex-[0_0_0px] md:gap-0 md:opacity-0 pointer-events-none',
            )}
          >
            <button
              type="button"
              onClick={() => {
                setPickupLocId(dropLocId);
                setDropLocId(pickupLocId);
              }}
              title="Swap locations"
              aria-label="Swap locations"
              className="flex flex-shrink-0 cursor-pointer items-center justify-center bg-transparent p-1 text-primary"
            >
              <Swap size={18} />
            </button>
            <LocationField which="drop" />
          </div>
          <div className="mx-3 hidden h-[44px] w-px flex-shrink-0 bg-line md:block" />
          <div className="min-w-0 flex-[1.7]">
            <div className="mb-[6px] text-[10px] tracking-[0.03em] text-faint uppercase"><Dyn>Pick-up Date &amp; Time</Dyn></div>
            <DateTimeField
              date={pickupDate}
              time={pickupTime}
              onDate={handlePickupDate}
              onTime={setPickupTime}
                minTime={minTime}
                maxTime={maxTime}
              minDate={todayISO()}
              label="Pick-up"
            />
          </div>
          <div className="mx-3 hidden h-[44px] w-px flex-shrink-0 bg-line md:block" />
          <div className="min-w-0 flex-[1.7]">
            <div className="mb-[6px] text-[10px] tracking-[0.03em] text-faint uppercase"><Dyn>Return Date &amp; Time</Dyn></div>
            <DateTimeField
              date={returnDate}
              time={returnTime}
              onDate={setReturnDate}
              onTime={setReturnTime}
                minTime={minTime}
                maxTime={maxTime}
              minDate={pickupDate || todayISO()}
              highlightDate={pickupDate}
              label="Return"
            />
          </div>
        </div>

        <div className="my-[14px] mt-[14px] mb-3 h-px bg-hairline" />

        {showDisc && (
          <div className="mb-3 flex items-center gap-[9px] rounded-lg border border-primary-border bg-primary-soft px-3 py-[6px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
              <circle cx="7.5" cy="7.5" r=".5" fill="var(--color-primary)" />
            </svg>
            <div className="text-[12.5px] leading-[1.45]">
              <span className="font-semibold text-secondary"><Dyn>{discTitle}</Dyn></span>{' '}
              <span className="text-primary"><Dyn>{discSub}</Dyn></span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label
            onClick={() => {
              setDiffLocation((d) => !d);
              setOpenLoc(null);
            }}
            className="flex cursor-pointer items-center gap-[9px] text-[13px] text-label"
          >
            <span
              className={cn(
                'inline-flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                diffLocation ? 'border-primary bg-primary' : 'border-control bg-white',
              )}
            >
              {diffLocation && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </span>
            <Dyn>Return car to different location</Dyn>
          </label>
          <button
            onClick={goSearch}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[7px] bg-primary px-[18px] py-[11px] text-[13.5px] font-semibold text-white sm:w-auto sm:py-[9px]"
          >
            <Dyn>Show Available Cars</Dyn>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
