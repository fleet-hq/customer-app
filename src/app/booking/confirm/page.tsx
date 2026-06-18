'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { Check, Clock, IdCard, Info, ShieldCheck } from '@/components/ui/icons';
import { cn, money } from '@/lib/utils';
import { formatCountdown, useConfirmState } from '@/lib/booking-state';
import { SAMPLE_BOOKING, bookingQuoteInput, getVehicle } from '@/lib/mock-data';
import { buildQuote } from '@/lib/pricing';
import { paths } from '@/lib/paths';

const booking = SAMPLE_BOOKING;
const vehicle = getVehicle(booking.vehicleId);
const quote = buildQuote(bookingQuoteInput(booking));
const totalLabel = money(quote.total);

const stripZip = (s: string) => s.replace(/\s*\d{5}$/, '');
const shortDate = (d: string) => d.replace(',', '').replace(/\s\d{4}$/, '');
const tripLabel = `${stripZip(booking.pickup.location)} · ${shortDate(booking.pickup.date)} → ${shortDate(
  booking.dropoff.date,
)} · ${booking.days} days`;

export default function ConfirmBookingPage() {
  const router = useRouter();
  const { secondsLeft, expired, idVerified, insVerified } = useConfirmState();

  const doneCount = (idVerified ? 1 : 0) + (insVerified ? 1 : 0);
  const bothDone = idVerified && insVerified;
  const payReady = bothDone && !expired;

  const steps = [
    {
      key: 'id',
      done: idVerified,
      title: 'ID verification',
      desc: "Add your driver's license details so we can confirm your identity.",
      href: paths.verifyId,
      Glyph: IdCard,
    },
    {
      key: 'ins',
      done: insVerified,
      title: 'Insurance verification',
      desc: 'Add your coverage details or confirm the plan you selected.',
      href: paths.verifyInsurance,
      Glyph: ShieldCheck,
    },
  ];

  return (
    <div className="bg-white text-ink">
      <Header />
      <div className="mx-auto max-w-[1140px] px-6 pt-[22px] pb-16">
        <BackLink href={paths.checkout(booking.vehicleId)}>Back to checkout</BackLink>

        <h1 className="mt-[14px] text-2xl font-semibold tracking-[-0.01em] text-ink">Confirm your booking</h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          We&apos;re holding this vehicle for you. Complete both verifications below, then pay to lock in your
          reservation — you&apos;re not charged until you confirm.
        </p>

        <div
          className={cn(
            'mt-[18px] flex flex-wrap items-center gap-[14px] rounded-[14px] border px-5 py-4',
            expired ? 'border-danger-border bg-danger-bg' : 'border-amber-border bg-amber-bg',
          )}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
            <Clock size={22} className={expired ? 'text-danger' : 'text-accent'} />
          </span>
          <div className="min-w-[200px] flex-1">
            <div className={cn('text-[15px] font-semibold', expired ? 'text-danger-text' : 'text-amber-text')}>
              {expired ? 'Your hold has expired' : "We're holding your vehicle"}
            </div>
            <div className={cn('mt-0.5 text-[12.5px]', expired ? 'text-danger-soft' : 'text-amber-text-2')}>
              {expired
                ? 'The reservation hold timed out. Head back to checkout to start again.'
                : 'Complete both verifications and pay before the timer runs out to confirm your booking.'}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className={cn('text-[10px] font-semibold tracking-[0.06em] uppercase', expired ? 'text-danger-soft' : 'text-amber-text-2')}>
              Time left
            </div>
            <div className={cn('tabular mt-0.5 text-[28px] leading-[1.1] font-bold', expired ? 'text-danger' : 'text-accent')}>
              {expired ? '00:00' : formatCountdown(secondsLeft)}
            </div>
          </div>
        </div>

        <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] min-[900px]:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[22px]">
            <div className="flex items-center gap-4 rounded-2xl border border-card-border bg-white px-[22px] py-5">
              <div
                className="h-[74px] w-[104px] flex-shrink-0 rounded-[11px] bg-cover bg-center"
                style={{ backgroundImage: `url('${vehicle?.image ?? '/images/car-cherokee.png'}')` }}
              />
              <div className="flex-1">
                <div className="text-[11px] text-faint">Reservation hold · #{booking.id}</div>
                <div className="my-[3px] text-[18px] font-semibold text-secondary">
                  {vehicle ? `${vehicle.name} ${vehicle.year}` : booking.vehicleName}
                </div>
                <div className="text-[12.5px] text-muted">{tripLabel}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-card-border bg-white px-6 py-[22px]">
              <div className="mb-[14px] flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Complete verification</h3>
                  <p className="mt-1 text-xs text-faint">Both steps must be verified before you can pay and confirm.</p>
                </div>
                <span className={cn('text-xs font-semibold whitespace-nowrap', bothDone ? 'text-success' : 'text-amber-text-2')}>
                  {doneCount} of 2 verified
                </span>
              </div>

              <div className="mb-5 h-[6px] overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(doneCount / 2) * 100}%` }} />
              </div>

              <div className="grid grid-cols-1 gap-[14px] min-[520px]:grid-cols-2">
                {steps.map(({ key, done, title, desc, href, Glyph }) => (
                  <div
                    key={key}
                    className={cn(
                      'flex min-h-[196px] flex-col rounded-[14px] border border-line p-[18px]',
                      done ? 'bg-green-bg' : 'bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl',
                          done ? 'bg-primary' : 'bg-chip-2',
                        )}
                      >
                        {done ? <Check size={20} strokeWidth={3} className="text-white" /> : <Glyph size={19} className="text-glyph" />}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-[9px] py-[3px] text-[10px] font-semibold',
                          done ? 'border border-green-border bg-white text-success' : 'bg-amber-bg text-amber-text-2',
                        )}
                      >
                        {done ? 'Verified' : 'Required'}
                      </span>
                    </div>
                    <div className="mt-[15px] text-sm font-semibold text-ink">{title}</div>
                    <div className="mt-1 flex-1 text-xs leading-[1.5] text-faint">{desc}</div>
                    <button
                      onClick={() => router.push(href)}
                      className={cn(
                        'mt-4 w-full rounded-[9px] border py-[11px] text-center text-[13px] font-semibold',
                        done ? 'border-edit-border bg-white text-secondary' : 'border-secondary bg-secondary text-white',
                      )}
                    >
                      {done ? 'Edit details' : 'Verify'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-card-border bg-subtle p-[22px] min-[900px]:sticky min-[900px]:top-[88px]">
            <div className="mb-[14px] text-sm font-semibold text-ink">Price summary</div>

            {quote.lines.map((line, i) =>
              line.group === 'discount' ? (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-[7px]">
                    <span className="font-medium text-primary">{line.label}</span>
                    {line.code && (
                      <span className="rounded-[5px] bg-primary-soft px-[7px] py-[2px] text-[10px] font-semibold text-primary">
                        {line.code}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-primary">−{money(Math.abs(line.amount))}</span>
                </div>
              ) : (
                <PriceRow key={i} label={line.label} sub={line.sub ?? ''} amount={money(line.amount)} />
              ),
            )}

            <div className="my-4 h-px bg-card-border" />

            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-ink">Total due</span>
              <span>
                <span className="mr-[3px] text-[11px] text-faint">USD</span>
                <span className="text-[22px] font-bold text-secondary">{totalLabel}</span>
              </span>
            </div>

            <button
              disabled={!payReady}
              onClick={() => payReady && router.push(paths.booking(booking.id))}
              className={cn(
                'mt-[18px] block w-full rounded-[10px] py-[14px] text-center text-sm font-bold text-white',
                payReady ? 'cursor-pointer bg-primary' : 'cursor-not-allowed bg-locked',
              )}
            >
              {payReady ? `Pay ${totalLabel} & confirm booking` : 'Complete verification to pay'}
            </button>

            <div className={cn('mt-[11px] flex items-center gap-[7px] text-[11.5px] leading-[1.45]', payReady ? 'text-success' : 'text-faint')}>
              {payReady ? <Check size={13} strokeWidth={2} /> : <Info size={13} strokeWidth={2} className="flex-shrink-0" />}
              <span>
                {payReady ? "All set — you'll be charged when you confirm." : 'Verify your ID and insurance to unlock payment.'}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-[9px]">
              {['No charge until you confirm', 'Free cancellation up to 48h', 'Encrypted, secure payment'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[11.5px] text-muted">
                  <Check size={14} strokeWidth={2} className="text-primary" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function PriceRow({ label, sub, amount }: { label: string; sub: string; amount: string }) {
  return (
    <div className="mb-3 flex items-start justify-between text-[13px]">
      <div>
        <div className="font-medium text-ink">{label}</div>
        <div className="mt-px text-[11.5px] text-faint">{sub}</div>
      </div>
      <span className="font-medium text-ink">{amount}</span>
    </div>
  );
}
