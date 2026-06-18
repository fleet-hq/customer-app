'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { DateTimeField } from '@/components/search/date-time-field';
import { Calendar, Info } from '@/components/ui/icons';
import { SAMPLE_BOOKING, bookingQuoteInput, DEFAULT_TRIP } from '@/lib/mock-data';
import { todayISO } from '@/lib/time-slots';
import { buildQuote } from '@/lib/pricing';
import { paths } from '@/lib/paths';
import { money, rentalDays } from '@/lib/utils';

export default function ModifyTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const currentTotal = buildQuote(bookingQuoteInput(SAMPLE_BOOKING)).total;

  const [location, setLocation] = useState(SAMPLE_BOOKING.pickup.location);
  const [pickupDate, setPickupDate] = useState(DEFAULT_TRIP.pickupDate);
  const [pickupTime, setPickupTime] = useState(DEFAULT_TRIP.pickupTime);
  const [returnDate, setReturnDate] = useState(DEFAULT_TRIP.returnDate);
  const [returnTime, setReturnTime] = useState(DEFAULT_TRIP.returnTime);

  const newDays = rentalDays(pickupDate, returnDate, pickupTime, returnTime);
  const flat = currentTotal - SAMPLE_BOOKING.pricePerDay * SAMPLE_BOOKING.days;
  const newTotal = SAMPLE_BOOKING.pricePerDay * newDays + flat;
  const diff = newTotal - currentTotal;
  const changed = Math.abs(diff) > 0.001;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <section className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={paths.booking(id)}>Back to booking</BackLink>

        <h1 className="mt-[14px] text-2xl font-semibold tracking-[-0.01em] text-ink">Modify your trip</h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          Update your pick-up and return details. Price changes are shown before you confirm.
        </p>

        <div className="mt-[22px] rounded-2xl border border-card-border bg-white p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-[18px]">
            <Field label="Pick-up location">
              <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pick-up location" />
            </Field>

            <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] min-[560px]:grid-cols-2">
              <Field label="Pick-up date & time">
                <div className="rounded-[10px] border border-line px-[14px] py-3">
                  <DateTimeField
                    date={pickupDate}
                    time={pickupTime}
                    onDate={setPickupDate}
                    onTime={setPickupTime}
                    minDate={todayISO()}
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
                    label="Return"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-[10px] rounded-[10px] border border-primary-border bg-primary-soft px-[14px] py-[12px]">
            <Info size={15} strokeWidth={2} className="mt-px flex-shrink-0 text-primary" />
            <span className="text-[11.5px] leading-[1.5] text-secondary">
              Changes are free up to 48 hours before pick-up. Any price difference is settled when you confirm.
            </span>
          </div>
        </div>

        <div className="mt-[22px] rounded-2xl border border-card-border bg-subtle p-6">
          <div className="mb-[14px] flex items-center gap-2 text-sm font-semibold text-ink">
            <Calendar size={16} className="text-primary" /> Price difference
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">Current total</span>
            <span className="font-medium text-ink">{money(currentTotal)}</span>
          </div>
          <div className="mt-[10px] flex items-center justify-between text-[13px]">
            <div>
              <span className="text-muted">New total</span>
              <span className="ml-2 text-[11.5px] text-faint">{money(SAMPLE_BOOKING.pricePerDay)} × {newDays} days</span>
            </div>
            <span className="font-semibold text-secondary">{money(newTotal)}</span>
          </div>

          <div className="my-4 h-px bg-card-border" />

          {!changed ? (
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              No price change yet — adjust your dates to see the difference.
            </div>
          ) : diff > 0 ? (
            <div className="flex items-center justify-between rounded-[10px] border border-amber-border bg-amber-bg px-4 py-[13px]">
              <span className="text-[13px] font-semibold text-amber-text">Additional payment due</span>
              <span className="text-[15px] font-bold text-amber-text-2">{money(diff)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-[10px] border border-green-border-2 bg-green-bg px-4 py-[13px]">
              <span className="text-[13px] font-semibold text-success">Refund due</span>
              <span className="text-[15px] font-bold text-success">{money(Math.abs(diff))}</span>
            </div>
          )}
        </div>

        <div className="mt-[22px] flex items-center gap-3">
          <button
            onClick={() => router.push(paths.booking(id))}
            className="flex-shrink-0 rounded-[10px] border border-line bg-white px-[26px] py-[13px] text-sm font-semibold text-ink"
          >
            Cancel
          </button>
          <button
            onClick={() => router.push(paths.paymentPending(id))}
            className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-bold text-white hover:bg-primary-hover"
          >
            Review changes
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
