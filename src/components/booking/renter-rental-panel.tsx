'use client';

import { useState } from 'react';

import { Dyn } from '@/components/i18n/Dyn';
import { cn, money } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import { useGiveRenterNotice, useRenterRental } from '@/hooks/useRentalSiteConfig';
import { extractApiErrorMessage } from '@/lib/api-errors';
import type { RenterPeriod, RenterRental } from '@/services/rentalServices';
import { DatePicker } from '@/components/ui/date-picker';
import { useBookingPayment } from '@/hooks/use-booking-payment';
import { Calendar } from '@/components/ui/icons';
import { cycleWords } from '@/lib/billing-cycle';
import { gigDashboard } from '@/lib/gig-dashboard';

const STATUS: Record<string, { label: string; tone: 'good' | 'bad' | 'due' | 'quiet' }> = {
  paid: { label: 'Paid', tone: 'good' },
  due: { label: 'Due', tone: 'due' },
  partly_paid: { label: 'Partly paid', tone: 'due' },
  failed: { label: 'Payment failed', tone: 'bad' },
  waived: { label: 'Waived', tone: 'quiet' },
  refunded: { label: 'Refunded', tone: 'quiet' },
};

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

const calendarDay = (date: string) => dayLabel(`${date}T12:00:00`);

function useSkin() {
  const isT2 = useIsT2();
  return {
    card: isT2 ? 'rounded-[var(--skin-radius,3px)] border-[var(--line)] bg-[var(--card)]' : 'rounded-2xl border-card-border bg-white',
    strong: isT2 ? 'text-[var(--text)]' : 'text-ink',
    quiet: isT2 ? 'text-[var(--text-muted)]' : 'text-muted',
    line: isT2 ? 'border-[var(--line)]' : 'border-hairline',
    link: isT2 ? 'text-[var(--brass)]' : 'text-primary',
    button: isT2 ? 'bg-[var(--brass)] text-[var(--paper)]' : 'bg-primary text-white hover:bg-primary-hover',
    progress: isT2 ? 'bg-[var(--brass)]' : 'bg-primary',
    tone: {
      good: isT2 ? 'text-[var(--success)]' : 'text-success',
      bad: isT2 ? 'text-[var(--danger)]' : 'text-danger',
      due: isT2 ? 'text-[var(--brass)]' : 'text-amber-text-2',
      quiet: isT2 ? 'text-[var(--text-muted)]' : 'text-faint',
      paid: isT2 ? 'text-[var(--success)]' : 'text-success',
      held: isT2 ? 'text-[var(--text-muted)]' : 'text-muted',
    },
  };
}

function renewalLine(rental: RenterRental): string | null {
  const renewal = rental.next_renewal;
  if (rental.ended_at) return `Ended ${dayLabel(rental.ended_at)}`;
  if (rental.closed) return 'No further payments will be taken';
  if (renewal.state === 'paused') return 'Billing is paused';
  if (renewal.state === 'on_hold') return 'On hold until the balance is paid';
  if (renewal.state === 'ending' && renewal.at) return `Your rental ends on ${dayLabel(renewal.at)}`;
  if (renewal.state !== 'scheduled' || !renewal.at) return null;
  const amount = renewal.amount ?? rental.recurring_amount;
  const verb = rental.collection_method === 'automatic' ? "We'll charge" : 'Next payment';
  return `${verb} ${amount ? money(Number(amount)) : ''} on ${dayLabel(renewal.at)}`.replace('  ', ' ');
}

export function RenterRentalPanel({
  bookingId,
  ongoing,
  deposit = 0,
  vehicleName = '',
  vehicleImage = '',
  bookingRef = '',
  pickupAt = null,
  swapHref = '',
  onUpdateCard,
}: {
  bookingId: string;
  ongoing: boolean;
  deposit?: number;
  vehicleName?: string;
  vehicleImage?: string;
  bookingRef?: string;
  pickupAt?: string | null;
  swapHref?: string;
  onUpdateCard: () => void;
}) {
  const skin = useSkin();
  const { data: rental } = useRenterRental(bookingId, ongoing);
  const notice = useGiveRenterNotice(bookingId);
  const [returnDate, setReturnDate] = useState('');
  const pay = useBookingPayment(bookingId, ongoing);
  if (!ongoing || !rental) return null;

  const view = gigDashboard({
    rental,
    vehicleName,
    bookingRef,
    pickupAt,
    deposit,
    outstanding: pay.outstanding,
  });
  const earliest = rental.earliest_return_date;
  const minimumEnd = rental.minimum_term_end_date;
  const plannedReturn = returnDate || earliest;
  const beforeMinimum = !!minimumEnd && plannedReturn < minimumEnd;
  const submitNotice = () => {
    if (returnDate) notice.mutate(returnDate);
  };

  return (
    <section className={cn('border p-5', skin.card)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className={cn('text-[11px] font-semibold uppercase tracking-[0.12em]', skin.quiet)}>
            <Dyn>{view.eyebrow}</Dyn>
          </p>
          <h3 className={cn('mt-1 text-[18px] font-bold', skin.strong)}>
            <Dyn>{view.title}</Dyn>
          </h3>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]', skin.line, 'border', skin.quiet)}>
          <Dyn>{view.stateLabel}</Dyn>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4">
        {view.stats.map((stat) => (
          <div key={stat.key} className={cn('border p-3.5', skin.line, skin.card)}>
            <span className={cn('block text-[10px] font-semibold uppercase tracking-[0.14em]', skin.quiet)}>
              <Dyn>{stat.label}</Dyn>
            </span>
            <b className={cn('mt-1.5 block text-[19px] font-bold leading-none', stat.due ? skin.tone.due : skin.strong)}>
              {stat.value}
            </b>
            <small className={cn('mt-1.5 block text-[11.5px] leading-[1.4]', skin.quiet)}>
              <Dyn>{stat.note}</Dyn>
            </small>
          </div>
        ))}
      </div>

      <div className={cn('mt-5 flex flex-wrap items-center gap-4 border p-4', skin.line)}>
        {vehicleImage ? (
          <img src={vehicleImage} alt="" className="h-[64px] w-[96px] shrink-0 object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h4 className={cn('text-[15px] font-bold', skin.strong)}>
            <Dyn>{vehicleName}</Dyn>
          </h4>
          <div className={cn('mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px]', skin.quiet)}>
            {view.carFacts.map((fact) => (
              <span key={fact.label}>
                <Dyn>{fact.label}</Dyn>{' '}
                <span className={skin.strong}>
                  <Dyn>{fact.value}</Dyn>
                </span>
              </span>
            ))}
          </div>
        </div>
        {swapHref && !rental.closed ? (
          <a href={swapHref} className={cn('border px-3 py-1.5 text-[12.5px] font-semibold', skin.line, skin.strong)}>
            <Dyn>Swap car</Dyn>
          </a>
        ) : null}
      </div>

      <div className={cn('mt-5 border p-4', skin.line)}>
        <div className="flex items-center justify-between gap-3">
          <h4 className={cn('text-[13px] font-bold uppercase tracking-[0.1em]', skin.strong)}>
            <Dyn>Billing</Dyn>
          </h4>
          <span className={cn('border px-2 py-0.5 text-[11px] font-semibold', skin.line, skin.strong)}>
            <Dyn>{view.cycleBadge}</Dyn>
          </span>
        </div>
        {view.cycleStart ? (
          <>
            <div className={cn('mt-3 h-[3px] w-full', skin.line, 'border-0 bg-current opacity-20')}>
              <div className={cn('h-full', skin.progress)} style={{ width: `${view.progress}%` }} />
            </div>
            <div className={cn('mt-1.5 flex justify-between text-[11.5px]', skin.quiet)}>
              <span>{view.cycleStart}</span>
              <span>{view.cycleEnd}</span>
            </div>
          </>
        ) : null}
        <p className={cn('mt-4 text-[11px] font-semibold uppercase tracking-[0.12em]', skin.quiet)}>
          <Dyn>{view.nextChargeHeading}</Dyn>
        </p>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <span className={cn('text-[12px] font-semibold uppercase tracking-[0.1em]', skin.quiet)}>
            <Dyn>Total</Dyn>
          </span>
          <span className={cn('text-[22px] font-bold', skin.strong)}>
            <span className={cn('mr-1 text-[11px] font-semibold', skin.quiet)}>USD</span>
            {view.nextChargeTotal}
          </span>
        </div>
        <p className={cn('mt-1.5 text-[12px] leading-[1.5]', skin.quiet)}>
          <Dyn>{view.autopayNote}</Dyn>
        </p>
        {!rental.closed ? (
          <button
            type="button"
            onClick={onUpdateCard}
            className={cn('mt-3 w-full border px-4 py-2 text-[12.5px] font-semibold', skin.line, skin.strong)}
          >
            <Dyn>{rental.card_on_file ? 'Update card' : 'Add a card'}</Dyn>
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h4 className={cn('text-[13px] font-bold uppercase tracking-[0.1em]', skin.strong)}>
          <Dyn>Payments</Dyn>
        </h4>
        {pay.outstanding > 0 ? (
          <button
            type="button"
            onClick={pay.handlePay}
            disabled={pay.payLoading}
            className={cn('px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-60', skin.button)}
          >
            <Dyn>{`Pay ${money(pay.outstanding)}`}</Dyn>
          </button>
        ) : null}
      </div>
      <ul className={cn('mt-2 divide-y border-y', skin.line)}>
        {view.rows.map((row) => (
          <li key={row.key} className={cn('flex items-center justify-between gap-3 py-3 text-[13px]', skin.line)}>
            <div className="flex min-w-0 items-baseline gap-3">
              <span className={cn('w-[52px] shrink-0 text-[11.5px]', skin.quiet)}>{row.date}</span>
              <span className={cn('truncate font-medium', skin.strong)}>
                <Dyn>{row.label}</Dyn>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={cn('font-medium tabular-nums', skin.strong)}>{row.amount}</span>
              <span className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', skin.tone[row.tone])}>
                <Dyn>{row.status}</Dyn>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className={cn('mt-5 border-t pt-4', skin.line)}>
        <p className={cn('text-[11px] font-semibold uppercase tracking-[0.12em]', skin.quiet)}>
          <Dyn>Your plan</Dyn>
        </p>
        <p className={cn('mt-1 text-[16px] font-bold uppercase', skin.strong)}>
          <Dyn>{view.planHeading}</Dyn>
        </p>
        <p className={cn('mt-1 text-[12.5px] leading-[1.5]', skin.quiet)}>
          <Dyn>{view.planNote}</Dyn>
        </p>
      {!rental.closed ? (
        <div className="mt-3">
          {rental.notice_return_date ? (
            <p className={cn('text-[13px]', skin.strong)}>
              <Dyn>Returning on</Dyn> {calendarDay(rental.notice_return_date)}
            </p>
          ) : (
            <>
              <p className={cn('text-[13px] font-medium', skin.strong)}>
                <Dyn>Return my car on…</Dyn>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DatePicker
                  value={returnDate}
                  onChange={setReturnDate}
                  minDate={earliest}
                  placeholder="Pick a return date"
                  aria-label="Return date"
                  icon={<Calendar size={15} />}
                  className={cn('min-w-[200px] rounded-lg border px-3 py-2 text-[13px]', skin.line, skin.strong)}
                />
                <button
                  type="button"
                  onClick={submitNotice}
                  disabled={!returnDate || notice.isPending}
                  className={cn('rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-60', skin.button)}
                >
                  <Dyn>{notice.isPending ? 'Saving…' : 'Give notice'}</Dyn>
                </button>
              </div>
              {rental.return_notice_days ? (
                <p className={cn('mt-2 text-[12px]', skin.quiet)}>
                  <Dyn>{`${rental.return_notice_days} days' notice needed — the earliest is ${calendarDay(earliest)}`}</Dyn>
                </p>
              ) : null}
              {beforeMinimum ? (
                <p className={cn('mt-2 text-[12px]', skin.tone.due)}>
                  <Dyn>{`Your plan has a ${rental.min_term_weeks}-week minimum, until ${calendarDay(minimumEnd!)}. Returning before then adds the remaining weeks as a charge.`}</Dyn>
                </p>
              ) : null}
              {notice.isError ? (
                <p className={cn('mt-2 text-[12px]', skin.tone.bad)}>
                  <Dyn>{extractApiErrorMessage(notice.error, 'We couldn’t save your return date. Please try again.')}</Dyn>
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      </div>
    </section>
  );
}
