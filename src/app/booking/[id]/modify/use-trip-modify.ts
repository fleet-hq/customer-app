'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useBookingDetails, useFleet, useFleetUnavailableRanges } from '@/hooks';
import { useDefaultLocation } from '@/contexts';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { toUtcIso, utcIsoToFormValues } from '@/utils/datetime';
import { buildUnavailabilityIndex } from '@/lib/unavailable-slots';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { describePriceChange } from '@/lib/price-change-notice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/** All trip-modify data, state, and handlers — shared verbatim by both
 *  templates' modify pages so this pricing/booking-mutation logic lives
 *  in exactly one place. Templates differ only in how they render what
 *  this returns. This is a pure mechanical extraction of what used to
 *  be inline in page.tsx — nothing about the logic itself has changed. */
export function useTripModify(id: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const tenant = useTenant();

  const defaultTz = useDefaultLocation()?.timezone ?? null;

  useEffect(() => {
    if (token) setBookingToken(token);
  }, [token]);

  const { data: booking, isLoading, isError } = useBookingDetails(id);
  const tz = booking?.timezone ?? defaultTz ?? undefined;

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [seeded, setSeeded] = useState(false);

  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!booking || seeded) return;
    if (tz && booking.pickUp.rawDatetime) {
      const p = utcIsoToFormValues(booking.pickUp.rawDatetime, tz);
      setPickupDate(p.date);
      setPickupTime(p.time);
    }
    if (tz && booking.dropOff.rawDatetime) {
      const d = utcIsoToFormValues(booking.dropOff.rawDatetime, tz);
      setReturnDate(d.date);
      setReturnTime(d.time);
    }
    setSeeded(true);
  }, [booking, tz, seeded]);

  const isOngoing = !!booking?.pickUp.rawDatetime
    && new Date(booking.pickUp.rawDatetime).getTime() <= Date.now();

  const [debouncedPickup, setDebouncedPickup] = useState({ date: '', time: '' });
  const [debouncedDropoff, setDebouncedDropoff] = useState({ date: '', time: '' });
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedPickup({ date: pickupDate, time: pickupTime });
      setDebouncedDropoff({ date: returnDate, time: returnTime });
    }, 350);
    return () => clearTimeout(t);
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const fleetDateArgs = useMemo(() => {
    if (!debouncedPickup.date || !debouncedDropoff.date || !tz) return undefined;
    return {
      pickupDatetime: toUtcIso(debouncedPickup.date, debouncedPickup.time || '00:00', tz),
      dropoffDatetime: toUtcIso(debouncedDropoff.date, debouncedDropoff.time || '00:00', tz),
    };
  }, [debouncedPickup, debouncedDropoff, tz]);

  const { data: fleet } = useFleet(booking?.fleetId, !!booking?.fleetId, fleetDateArgs);

  const { t } = useDynamicTranslation([
    'Pick-up date & time',
    '(locked — trip has started)',
    'Return date & time',
    'Additional rental',
    'Tax',
    'Insurance (additional days)',
    'Rental total',
    'Fleet discount',
    'Location charges',
    'Booking fees',
    'Insurance',
    'Premium is recalculated by your insurance provider for the new dates; you pay the difference between the original and the new premium.',
    'Insurance (refundable)',
    "Premium is recalculated by your insurance provider for the new shorter dates; you're refunded the difference.",
    'Insurance (non-refundable)',
    'Modification fee',
    'Previous total',
    'These dates are not available for this change.',
    'Processing...',
    'Confirm refund',
    'Review & pay',
    'Confirm changes',
    'Please select both pick-up and return dates.',
    'Failed to modify trip.',
  ]);

  const handlePickupDate = (d: string) => {
    setPickupDate(d);
    if (!returnDate || d > returnDate) setReturnDate(d);
  };

  const { data: unavailableRanges = [] } = useFleetUnavailableRanges(
    booking?.fleetId,
    booking ? { excludeBookingId: booking.id } : undefined,
  );
  const unavailabilityIndex = useMemo(
    () => buildUnavailabilityIndex(unavailableRanges, tz ?? null),
    [unavailableRanges, tz],
  );
  const unavailableDates = unavailabilityIndex.fullyBlockedDates;

  useEffect(() => {
    if (!pickupDate || !pickupTime || !returnDate || !returnTime || !booking || !tz) return;

    const newPickup = toUtcIso(pickupDate, pickupTime, tz);
    const newDropoff = toUtcIso(returnDate, returnTime, tz);

    const origPickup = booking.pickUp.rawDatetime || '';
    const origDropoff = booking.dropOff.rawDatetime || '';
    if (
      new Date(newPickup).getTime() === new Date(origPickup).getTime() &&
      new Date(newDropoff).getTime() === new Date(origDropoff).getTime()
    ) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: {
            type: newDropoff > origDropoff ? 'extend' : 'reduce',
            new_pickup_datetime: newPickup,
            new_dropoff_datetime: newDropoff,
          },
        });
        setPreview(res.data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pickupDate, pickupTime, returnDate, returnTime, booking, tz]);

  const handleConfirm = async () => {
    if (!booking || !tz) return;
    if (!pickupDate || !returnDate) {
      setError('Please select both pick-up and return dates.');
      return;
    }
    setSaving(true);
    setError('');

    const newPickup = toUtcIso(pickupDate, pickupTime || '00:00', tz);
    const newDropoff = toUtcIso(returnDate, returnTime || '00:00', tz);
    const isExtension =
      new Date(newDropoff).getTime() > new Date(booking.dropOff.rawDatetime).getTime();

    try {
      const successUrl = `${window.location.origin}/booking/${id}?token=${token || ''}`;
      const cancelUrl = `${window.location.origin}/booking/${id}/modify?token=${token || ''}`;

      const res = await axios.post(
        `${API_URL}/api/bookings/public/modify/`,
        {
          type: isExtension ? 'extend' : 'reduce',
          new_pickup_datetime: newPickup,
          new_dropoff_datetime: newDropoff,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        { headers: getBookingTokenHeaders() },
      );

      if (res.data.status === 'checkout_required' && res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        router.push(`/booking/${id}?token=${token || ''}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to modify trip.');
      setSaving(false);
    }
  };

  if (isLoading) {
    return { status: 'loading' as const, tenant };
  }

  if (isError || !booking) {
    return { status: 'not-found' as const, tenant };
  }

  const priceDiff = preview?.price_difference ? parseFloat(preview.price_difference) : 0;
  const modificationFee = preview?.modification_fee ? parseFloat(preview.modification_fee) : 0;
  const newTotal = preview?.new_total != null ? parseFloat(preview.new_total) : null;
  const currentTotal = parseFloat(booking.totalPrice || '0') || booking.invoice.total;
  const notAllowed = preview?.allowed === false;
  const changed = newTotal !== null && !notAllowed;

  const nb = preview?.new_breakdown ?? null;
  const num = (v: any) => (v != null ? parseFloat(v) || 0 : 0);
  const newDays = preview?.new_days ?? null;
  const unitLabel = booking.invoice.items[0]?.unit || 'day';
  const nbBase = nb ? num(nb.base_price) : 0;
  const nbDiscounted = nb ? num(nb.discounted_price || nb.base_price) : 0;
  const nbFleetDiscount = Math.max(0, nbBase - nbDiscounted);
  const nbLocation = nb ? num(nb.location_charges) : 0;
  const nbFees = nb ? num(nb.fees) : 0;
  const nbInsurance = nb ? num(nb.insurance) : 0;
  const nbTax = nb ? num(nb.tax) : 0;
  const extensionInsurance = num(preview?.extension_insurance);
  const insuranceRefund = num(preview?.insurance_refund);
  const insuranceExcluded = num(preview?.insurance_excluded);
  const originalTotal = preview?.original_total != null ? num(preview.original_total) : currentTotal;
  const priceNotice = changed ? describePriceChange(preview) : null;

  return {
    status: 'ready' as const,
    tenant,
    id,
    token,
    router,
    booking,
    t,
    pickupDate,
    pickupTime,
    setPickupTime,
    returnDate,
    returnTime,
    setReturnDate,
    setReturnTime,
    isOngoing,
    handlePickupDate,
    unavailableDates,
    unavailabilityIndex,
    fleet,
    changed,
    preview,
    previewLoading,
    saving,
    error,
    handleConfirm,
    priceDiff,
    modificationFee,
    newTotal,
    currentTotal,
    notAllowed,
    nb,
    newDays,
    unitLabel,
    nbBase,
    nbFleetDiscount,
    nbLocation,
    nbFees,
    nbInsurance,
    nbTax,
    extensionInsurance,
    insuranceRefund,
    insuranceExcluded,
    originalTotal,
    priceNotice,
  };
}
