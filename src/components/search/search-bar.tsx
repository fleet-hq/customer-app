'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paths } from '@/lib/paths';
import { DEFAULT_TRIP } from '@/lib/mock-data';
import { todayISO } from '@/lib/time-slots';
import { useCompanyLocations } from '@/hooks';
import { useFleetDiscountsSummary } from '@/hooks/useFleetDiscounts';
import { cn, rentalDays } from '@/lib/utils';
import { ArrowRight, Check, ChevronDown, MapPin, Search, Swap } from '@/components/ui/icons';
import { DateTimeField } from './date-time-field';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
}

export function SearchBar({ variant = 'hero' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: apiLocations } = useCompanyLocations();
  const pickupLocations = useMemo(
    () => (apiLocations ?? []).filter((l) => l.type === 'pickup' || l.type === 'both'),
    [apiLocations],
  );
  const dropoffLocations = useMemo(
    () => (apiLocations ?? []).filter((l) => l.type === 'dropoff' || l.type === 'both'),
    [apiLocations],
  );

  const [pickupLocId, setPickupLocId] = useState<string>(() => searchParams.get('pickupLocId') ?? '');
  const [dropLocId, setDropLocId] = useState<string>(() => searchParams.get('dropoffLocId') ?? '');
  const [pickupDate, setPickupDate] = useState(() => searchParams.get('pickupDate') ?? DEFAULT_TRIP.pickupDate);
  const [returnDate, setReturnDate] = useState(() => searchParams.get('returnDate') ?? DEFAULT_TRIP.returnDate);
  const [pickupTime, setPickupTime] = useState(() => searchParams.get('pickupTime') ?? DEFAULT_TRIP.pickupTime);
  const [returnTime, setReturnTime] = useState(() => searchParams.get('returnTime') ?? DEFAULT_TRIP.returnTime);
  const [diffLocation, setDiffLocation] = useState(() => {
    const drop = searchParams.get('dropoffLocId');
    const pick = searchParams.get('pickupLocId');
    return !!drop && drop !== pick;
  });
  const [openLoc, setOpenLoc] = useState<null | 'pickup' | 'drop'>(null);

  useEffect(() => {
    if (pickupLocations.length && !pickupLocId) setPickupLocId(pickupLocations[0].id);
    if (dropoffLocations.length && !dropLocId) setDropLocId(dropoffLocations[0].id);
  }, [pickupLocations, dropoffLocations, pickupLocId, dropLocId]);

  const selectedPickup = pickupLocations.find((l) => l.id === pickupLocId);
  const selectedDrop = dropoffLocations.find((l) => l.id === dropLocId);
  const minTime = selectedPickup && !selectedPickup.is247 ? selectedPickup.openingTime : null;
  const maxTime = selectedPickup && !selectedPickup.is247 ? selectedPickup.closingTime : null;

  const handlePickupDate = (d: string) => {
    setPickupDate(d);
    if (!returnDate || d > returnDate) setReturnDate(d);
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (openLoc && rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenLoc(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openLoc]);

  const days = rentalDays(pickupDate, returnDate, pickupTime, returnTime);

  // Weekly discount banner — every weekly tier has an implicit
  // 1-week threshold (7 days), so the banner has two states:
  //  • Picked < 7 days → "Add N more days to save X% per day."
  //  • Picked ≥ 7 days → "You're getting our best weekly rate. X% off…"
  // The headline percentage is the highest configured weekly tier.
  const { data: discountsSummary } = useFleetDiscountsSummary();
  const bestWeeklyPct = useMemo(() => {
    const weekly = (discountsSummary?.tiers ?? []).filter(
      (t) => t.unit_type === 'week',
    );
    return weekly.reduce((m, t) => (t.percentage > m ? t.percentage : m), 0);
  }, [discountsSummary]);
  const WEEK_DAYS = 7;
  const earnedWeekly = bestWeeklyPct > 0 && days >= WEEK_DAYS;
  const showDisc = bestWeeklyPct > 0;
  let discTitle = '';
  let discSub = '';
  if (showDisc) {
    if (earnedWeekly) {
      discTitle = "You've unlocked our best weekly rate.";
      discSub = `Up to ${bestWeeklyPct}% off the daily rate on this ${days}-day rental depending on the car you pick.`;
    } else {
      const d = WEEK_DAYS - days;
      discTitle = `Add ${d} more ${d === 1 ? 'day' : 'days'} to save up to ${bestWeeklyPct}% per day.`;
      discSub = `Rent 1+ weeks and up to ${bestWeeklyPct}% comes off the daily rate.`;
    }
  }

  const goSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (pickupLocId) params.set('pickupLocId', pickupLocId);
    else params.delete('pickupLocId');
    if (diffLocation && dropLocId) params.set('dropoffLocId', dropLocId);
    else params.delete('dropoffLocId');
    params.set('pickupDate', pickupDate);
    params.set('pickupTime', pickupTime);
    params.set('returnDate', returnDate);
    params.set('returnTime', returnTime);
    router.push(`${paths.fleet}?${params.toString()}`);
  };

  const LocationField = ({ which }: { which: 'pickup' | 'drop' }) => {
    const selected = which === 'pickup' ? selectedPickup : selectedDrop;
    const value = selected?.name ?? '';
    const list = which === 'pickup' ? pickupLocations : dropoffLocations;
    const open = openLoc === which;
    return (
      <div className="relative min-w-0 flex-[1.3]">
        <div className="mb-[6px] text-[10px] tracking-[0.03em] text-faint uppercase">
          {which === 'pickup' ? 'Pick-up' : 'Drop-off'}
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
            {value || <span className="text-placeholder">Select location</span>}
          </span>
          <ChevronDown size={13} className="flex-shrink-0 text-faint" />
        </button>
        {open && (
          <div role="listbox" className="absolute top-full right-0 left-0 z-40 mt-[10px] max-h-[260px] overflow-y-auto rounded-[11px] border border-line bg-white p-[6px] shadow-[var(--shadow-pop)]">
            {list.length === 0 ? (
              <div className="px-[11px] py-[10px] text-[13px] text-faint">No locations available</div>
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
                title="Swap locations"
                aria-label="Swap locations"
                className="flex flex-shrink-0 cursor-pointer items-center justify-center bg-transparent p-1 text-primary"
              >
                <Swap size={16} />
              </button>
              <LocationField which="drop" />
            </div>
            <div className="mx-[9px] hidden h-[38px] w-px flex-shrink-0 bg-line md:block" />
            <div className="min-w-0 flex-[1.55]">
              <div className="mb-[5px] text-[10px] tracking-[0.03em] text-faint uppercase">Pick-up Date &amp; Time</div>
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
              <div className="mb-[5px] text-[10px] tracking-[0.03em] text-faint uppercase">Return Date &amp; Time</div>
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
              <span className="md:hidden">Search</span>
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
            Return car to different location
          </label>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="w-full">
      <div className="rounded-xl border border-card-border bg-white px-5 pt-5 pb-4 shadow-[var(--shadow-card)] md:px-8 md:pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
            <div className="mb-[6px] text-[10px] tracking-[0.03em] text-faint uppercase">Pick-up Date &amp; Time</div>
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
            <div className="mb-[6px] text-[10px] tracking-[0.03em] text-faint uppercase">Return Date &amp; Time</div>
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
              <span className="font-semibold text-secondary">{discTitle}</span>{' '}
              <span className="text-primary">{discSub}</span>
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
            Return car to different location
          </label>
          <button
            onClick={goSearch}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[7px] bg-primary px-[18px] py-[11px] text-[13.5px] font-semibold text-white sm:w-auto sm:py-[9px]"
          >
            Show Available Cars
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
