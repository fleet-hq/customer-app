'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { ArrowRight, Check, Close, Info } from '@/components/ui/icons';
import { SAMPLE_BOOKING, bookingQuoteInput } from '@/lib/mock-data';
import { buildQuote } from '@/lib/pricing';
import { paths } from '@/lib/paths';
import { cn, money } from '@/lib/utils';

const REASONS = ['Plans changed', 'Found a better option', 'Booked by mistake', 'Other'];

export default function CancelBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reason, setReason] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const total = buildQuote(bookingQuoteInput(SAMPLE_BOOKING)).total;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <section className="mx-auto w-full max-w-[640px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={paths.booking(id)}>Back to booking</BackLink>

        {!cancelled ? (
          <div className="mt-[18px] rounded-2xl border border-card-border bg-white p-6">
            <div className="flex items-start gap-[13px]">
              <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-danger-bg">
                <Close size={22} strokeWidth={2.2} className="text-danger" />
              </span>
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Cancel this booking?</h1>
                <p className="mt-1 text-[13px] leading-[1.55] text-muted">
                  You can cancel for free up to 48 hours before pick-up. This can&apos;t be undone.
                </p>
              </div>
            </div>

            <div className="mt-[22px] rounded-[12px] bg-subtle p-5">
              <div className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">You&apos;re cancelling</div>
              <div className="mt-[6px] text-[16px] font-semibold text-secondary">{SAMPLE_BOOKING.vehicleName}</div>
              <div className="mt-[3px] text-[12.5px] text-muted">
                {SAMPLE_BOOKING.pickup.date} → {SAMPLE_BOOKING.dropoff.date} · {SAMPLE_BOOKING.days} days
              </div>
              <div className="my-[14px] h-px bg-card-border" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted">Booking total</span>
                <span className="text-[15px] font-bold text-secondary">{money(total)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-[10px] rounded-[10px] border border-primary-border bg-primary-soft px-[14px] py-[12px]">
              <Info size={15} strokeWidth={2} className="mt-px flex-shrink-0 text-primary" />
              <span className="text-[11.5px] leading-[1.5] text-secondary">
                Free cancellation applies. You&apos;ll receive a full refund of {money(total)} to your original payment method.
              </span>
            </div>

            <div className="mt-6">
              <div className="mb-[10px] text-[13px] font-semibold text-ink">Why are you cancelling?</div>
              <div className="flex flex-col gap-[10px]">
                {REASONS.map((r) => {
                  const active = reason === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={cn(
                        'flex items-center gap-[12px] rounded-[10px] border px-4 py-[13px] text-left text-[13.5px] font-medium transition-colors',
                        active ? 'border-[1.5px] border-primary bg-primary-soft text-secondary' : 'border-line bg-white text-ink hover:border-primary',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px]',
                          active ? 'border-primary bg-primary' : 'border-control',
                        )}
                      >
                        {active && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
                      </span>
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={paths.booking(id)}
                className="flex-1 rounded-[10px] border border-line bg-white py-[13px] text-center text-sm font-semibold text-ink"
              >
                Keep booking
              </Link>
              <button
                disabled={!reason}
                onClick={() => setCancelled(true)}
                className={cn(
                  'flex-1 rounded-[10px] py-[13px] text-sm font-bold text-white',
                  reason ? 'bg-danger' : 'cursor-not-allowed bg-locked',
                )}
              >
                Cancel booking
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-[18px] rounded-2xl border border-card-border bg-white p-8 text-center">
            <span className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-green-bg">
              <Check size={28} strokeWidth={3} className="text-primary" />
            </span>
            <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.01em] text-ink">Booking cancelled</h1>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">
              Your reservation for {SAMPLE_BOOKING.vehicleName} has been cancelled.
            </p>
            <div className="mx-auto mt-6 max-w-[360px] rounded-[12px] border border-green-border-2 bg-green-bg px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-success">Refund issued</span>
                <span className="text-[16px] font-bold text-success">{money(total)}</span>
              </div>
              <div className="mt-1 text-left text-[11.5px] text-success">Expect it on your original payment method within 5–10 business days.</div>
            </div>
            <Link
              href={paths.manage}
              className="mt-7 inline-flex items-center gap-2 rounded-[10px] bg-primary px-[26px] py-[13px] text-sm font-bold text-white hover:bg-primary-hover"
            >
              Back to my bookings <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
