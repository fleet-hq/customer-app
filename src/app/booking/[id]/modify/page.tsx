'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { BackLink } from '@/components/ui/back-link';
import { Field } from '@/components/ui/field';
import { DateTimeField } from '@/components/search/date-time-field';
import { Calendar, Info } from '@/components/ui/icons';
import { todayISO } from '@/lib/time-slots';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { useBookingDetails, useFleet, useFleetUnavailableRanges } from '@/hooks';
import { useDefaultLocation } from '@/contexts';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { toUtcIso, utcIsoToFormValues } from '@/utils/datetime';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function Row({ label, value, muted, note }: { label: string; value: string; muted?: boolean; note?: string }) {
  return (
    <>
      <div className="flex items-center justify-between text-[13px]">
        <span className={muted ? 'text-muted' : 'text-secondary'}>{label}</span>
        <span className={muted ? 'text-ink' : 'font-medium text-ink'}>{value}</span>
      </div>
      {note && <p className="mt-[2px] text-[10.5px] leading-[1.45] italic text-faint">{note}</p>}
    </>
  );
}

export default function ModifyTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

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

  const handlePickupDate = (d: string) => {
    setPickupDate(d);
    if (!returnDate || d > returnDate) setReturnDate(d);
  };

  const { data: unavailableRanges = [] } = useFleetUnavailableRanges(
    booking?.fleetId,
    booking ? { excludeBookingId: booking.id } : undefined,
  );
  const unavailableDates = useMemo(() => {
    const out = new Set<string>();
    for (const r of unavailableRanges) {
      const start = new Date(r.start);
      const end = new Date(r.end);
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      while (d <= stop) {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        out.add(`${yyyy}-${mm}-${dd}`);
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    return Array.from(out);
  }, [unavailableRanges]);

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
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-20 text-center">
          <p className="text-muted">Loading...</p>
        </section>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-20 text-center">
          <h1 className="text-2xl font-semibold text-ink">Booking not found</h1>
          <p className="mt-2 text-muted">The booking you are looking for does not exist.</p>
        </section>
      </div>
    );
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

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={`${paths.booking(id)}?token=${token || ''}`}>Back to booking</BackLink>

        <h1 className="mt-[14px] text-2xl font-semibold tracking-[-0.01em] text-ink">Modify your trip</h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          Update your pick-up and return details. Price changes are shown before you confirm.
        </p>

        <div className="mt-[22px] rounded-2xl border border-card-border bg-white p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-[18px]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] min-[560px]:grid-cols-2">
              <Field label={`Pick-up date & time${isOngoing ? ' (locked — trip has started)' : ''}`}>
                <div className={`rounded-[10px] border border-line px-[14px] py-3 ${isOngoing ? 'opacity-75' : ''}`}>
                  <DateTimeField
                    date={pickupDate}
                    time={pickupTime}
                    onDate={isOngoing ? () => {} : handlePickupDate}
                    onTime={isOngoing ? () => {} : setPickupTime}
                    minDate={todayISO()}
                    unavailableDates={unavailableDates}
                    label="Pick-up"
                  />
                </div>
              </Field>
              <Field label="Return date & time">
                <div className="rounded-[10px] border border-line px-[14px] py-3">
                  <DateTimeField
                    date={returnDate}
                    time={returnTime}
                    onDate={setReturnDate}
                    onTime={setReturnTime}
                    minDate={pickupDate || todayISO()}
                    highlightDate={pickupDate}
                    unavailableDates={unavailableDates}
                    label="Return"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-[10px] rounded-[10px] border border-primary-border bg-primary-soft px-[14px] py-[12px]">
            <Info size={15} strokeWidth={2} className="mt-px flex-shrink-0 text-primary" />
            <span className="text-[11.5px] leading-[1.5] text-secondary">
              Any price difference is settled when you confirm. Dates already booked are not available.
            </span>
          </div>
        </div>

        {(fleet?.isPeakPricing || fleet?.isPromoPricing) && changed && (
          <div className="mt-[14px] space-y-2">
            {fleet?.isPeakPricing && (
              <p className="rounded-[10px] border border-amber-border bg-amber-bg px-[14px] py-[10px] text-[11.5px] leading-[1.5] text-amber-text">
                Peak-day pricing is in effect for the selected dates.
              </p>
            )}
            {fleet?.isPromoPricing && (
              <p className="rounded-[10px] border border-green-border-2 bg-green-bg px-[14px] py-[10px] text-[11.5px] leading-[1.5] text-success">
                Promo pricing is in effect for the selected dates.
              </p>
            )}
          </div>
        )}

        <div className="mt-[22px] rounded-2xl border border-card-border bg-subtle p-6">
          <div className="mb-[14px] flex items-center gap-2 text-sm font-semibold text-ink">
            <Calendar size={16} className="text-primary" /> Price difference
          </div>

          {changed && nb ? (
            <div className="space-y-[10px]">
              {priceDiff >= 0 && nbFees === 0 ? (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint">Extension charges</p>
                  <Row
                    label={`Additional rental${newDays != null ? ` (${newDays} ${unitLabel}${newDays === 1 ? '' : 's'})` : ''}`}
                    value={money(nbBase)}
                  />
                  {nbTax > 0 && <Row label="Tax" value={money(nbTax)} />}
                  {(extensionInsurance || nbInsurance) > 0 && (
                    <Row label="Insurance (additional days)" value={money(extensionInsurance || nbInsurance)} />
                  )}
                </>
              ) : (
                <>
                  <Row label="Rental total" value={money(nbBase)} />
                  {nbFleetDiscount > 0 && <Row label="Fleet discount" value={`-${money(nbFleetDiscount)}`} />}
                  {nbLocation > 0 && <Row label="Location charges" value={money(nbLocation)} />}
                  {nbFees > 0 && <Row label="Booking fees" value={money(nbFees)} />}
                  {nbInsurance > 0 && (
                    <Row
                      label="Insurance"
                      value={money(nbInsurance)}
                      note={extensionInsurance > 0 ? 'Premium is recalculated by your insurance provider for the new dates; you pay the difference between the original and the new premium.' : undefined}
                    />
                  )}
                  {nbTax > 0 && <Row label="Tax" value={money(nbTax)} />}
                </>
              )}

              {priceDiff < 0 && (
                <>
                  {insuranceRefund > 0 && (
                    <Row
                      label="Insurance (refundable)"
                      value={`+${money(insuranceRefund)}`}
                      note="Premium is recalculated by your insurance provider for the new shorter dates; you're refunded the difference."
                    />
                  )}
                  {insuranceExcluded > 0 && <Row label="Insurance (non-refundable)" value={`-${money(insuranceExcluded)}`} />}
                </>
              )}
              {modificationFee > 0 && <Row label="Modification fee" value={`-${money(modificationFee)}`} />}

              <div className="my-1 h-px bg-card-border" />
              <Row label="Previous total" value={money(originalTotal)} muted />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">New total</span>
                <span className="text-[17px] font-bold text-ink">{money(newTotal!)}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted">Current total</span>
                <span className="font-medium text-ink">{money(currentTotal)}</span>
              </div>
              <div className="mt-[10px] flex items-center justify-between text-[13px]">
                <div>
                  <span className="text-muted">New total</span>
                  {newTotal !== null && (
                    <span className="ml-2 text-[11.5px] text-faint">
                      {money(newTotal)}
                      {newDays != null ? ` · ${newDays} ${unitLabel}${newDays === 1 ? '' : 's'}` : ''}
                      {modificationFee > 0 ? ` · incl. ${money(modificationFee)} fee` : ''}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-secondary">{newTotal !== null ? money(newTotal) : '—'}</span>
              </div>
            </>
          )}

          <div className="my-4 h-px bg-card-border" />

          {previewLoading ? (
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              Calculating...
            </div>
          ) : notAllowed ? (
            <div className="flex items-center gap-2 text-[12.5px] text-red-600">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              {preview.reason || 'These dates are not available for this change.'}
            </div>
          ) : !changed ? (
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              No price change yet — adjust your dates to see the difference.
            </div>
          ) : priceDiff > 0 ? (
            <div className="flex items-center justify-between rounded-[10px] border border-amber-border bg-amber-bg px-4 py-[13px]">
              <span className="text-[13px] font-semibold text-amber-text">Additional payment due</span>
              <span className="text-[15px] font-bold text-amber-text-2">{money(priceDiff)}</span>
            </div>
          ) : priceDiff < 0 ? (
            <div className="flex items-center justify-between rounded-[10px] border border-green-border-2 bg-green-bg px-4 py-[13px]">
              <span className="text-[13px] font-semibold text-success">Refund due</span>
              <span className="text-[15px] font-bold text-success">{money(Math.abs(priceDiff))}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              No additional charge for this change.
            </div>
          )}
        </div>

        {error && <p className="mt-[14px] text-[13px] text-red-600">{error}</p>}

        <div className="mt-[22px] flex items-center gap-3">
          <button
            onClick={() => router.push(`${paths.booking(id)}?token=${token || ''}`)}
            className="flex-shrink-0 rounded-[10px] border border-line bg-white px-[26px] py-[13px] text-sm font-semibold text-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || previewLoading || notAllowed}
            className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'Processing...'
              : priceDiff < 0
                ? 'Confirm refund'
                : priceDiff > 0
                  ? 'Review & pay'
                  : 'Confirm changes'}
          </button>
        </div>
      </section>
    </div>
  );
}
