'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paths } from '@/lib/paths';
import { isEmbedded, requestHandoff } from '@/lib/embed-bridge';
import { DEFAULT_TRIP } from '@/lib/mock-data';
import { useCompanyLocations } from '@/hooks';
import { useCompany } from '@/contexts';
import { useFleetDiscountsSummary } from '@/hooks/useFleetDiscounts';
import { pickDefaultLocation } from '@/lib/locations';
import { rentalDays } from '@/lib/utils';

const WEEK_DAYS = 7;

/** All search-bar state — locations, trip dates, the weekly-discount
 *  banner copy, and the embed-aware submit — shared by both templates'
 *  search bars so this navigation/booking logic lives in exactly one
 *  place. Templates differ only in how they render what this returns. */
export function useSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: apiLocations } = useCompanyLocations();
  const { company, isLoading: companyLoading } = useCompany();
  const defaultLoc = company?.defaultLocation ?? null;
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
    // Wait for the company's default location to resolve, otherwise a
    // fast locations response seeds the alphabetically-first location
    // and the effect never runs again to correct it.
    if (companyLoading) return;
    if (pickupLocations.length && !pickupLocId) {
      const def = pickDefaultLocation(pickupLocations, defaultLoc?.id);
      if (def) setPickupLocId(def.id);
    }
    if (dropoffLocations.length && !dropLocId) {
      const def = pickDefaultLocation(dropoffLocations, defaultLoc?.id);
      if (def) setDropLocId(def.id);
    }
  }, [pickupLocations, dropoffLocations, pickupLocId, dropLocId, defaultLoc, companyLoading]);

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
    const weekly = (discountsSummary?.tiers ?? []).filter((t) => t.unit_type === 'week');
    return weekly.reduce((m, t) => (t.percentage > m ? t.percentage : m), 0);
  }, [discountsSummary]);
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

    // Widget context: when rendered inside a partner's iframe with an
    // embed_redirect param, hand off to that URL in the top window so the
    // customer lands on the partner's own Book Now page (which itself
    // embeds our /fleet catalog). Fall through to internal navigation for
    // the standard customer-central flow — existing tenants on their own
    // domains are completely untouched.
    const embedRedirect = searchParams.get('embed_redirect');
    if (isEmbedded() && embedRedirect) {
      try {
        const target = new URL(embedRedirect);
        const FORWARD_KEYS = [
          'pickupLocId',
          'dropoffLocId',
          'pickupDate',
          'pickupTime',
          'returnDate',
          'returnTime',
          'pickup',
          'dropoff',
          'location',
        ];
        for (const key of FORWARD_KEYS) {
          const v = params.get(key);
          if (v) target.searchParams.set(key, v);
        }
        requestHandoff(target.toString());
        return;
      } catch {
        /* malformed redirect URL — fall through to router.push */
      }
    }

    router.push(`${paths.fleet}?${params.toString()}`);
  };

  return {
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
  };
}
