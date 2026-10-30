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
import { rentalStats } from '@/lib/rental-stats';

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
    tone: {
      good: isT2 ? 'text-[var(--success)]' : 'text-success',
      bad: isT2 ? 'text-[var(--danger)]' : 'text-danger',
      due: isT2 ? 'text-[var(--brass)]' : 'text-amber-text-2',
      quiet: isT2 ? 'text-[var(--text-muted)]' : 'text-faint',
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
  onUpdateCard,
}: {
  bookingId: string;
  ongoing: boolean;
  deposit?: number;
  onUpdateCard: () => void;
}) {
  const skin = useSkin();
  const { data: rental } = useRenterRental(bookingId, ongoing);
  const notice = useGiveRenterNotice(bookingId);
  const [returnDate, setReturnDate] = useState('');
  const pay = useBookingPayment(bookingId, ongoing);
  if (!ongoing || !rental) return null;

  const renewal = renewalLine(rental);
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
        <h3 className={cn('text-[16px] font-bold', skin.strong)}>
          <Dyn>{rental.plan?.name ?? cycleWords(rental.billing_cycle).rentalTitle}</Dyn>
        </h3>
        {renewal ? <span className={cn('text-[13px]', skin.quiet)}><Dyn>{renewal}</Dyn></span> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4">
        {rentalStats(rental, deposit).map((stat) => (
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

      <ul className={cn('mt-4 divide-y border-y', skin.line)}>
        {rental.periods.map((period: RenterPeriod) => {
          const status = STATUS[period.status] ?? { label: period.status, tone: 'quiet' as const };
          const owing = Number(period.outstanding) > 0;
          return (
            <li key={period.id} className={cn('flex items-center justify-between gap-3 py-3 text-[13px]', skin.line)}>
              <div>
                <div className={cn('font-medium', skin.strong)}><Dyn>{period.label}</Dyn></div>
                <div className={cn('mt-0.5 text-[11.5px] font-semibold', skin.tone[period.overdue ? 'bad' : status.tone])}>
                  <Dyn>{period.overdue ? 'Overdue' : status.label}</Dyn>
                  {period.status === 'paid' && period.method_label ? <span className={skin.quiet}> · {period.method_label}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('font-medium tabular-nums', skin.strong)}>{money(Number(period.amount))}</span>
                {owing ? (
                  <button type="button" onClick={pay.handlePay} disabled={pay.payLoading} className={cn('font-semibold disabled:opacity-60', skin.link)}>
                    <Dyn>Pay now</Dyn>
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {rental.charges.length > 0 ? (
        <>
          <h4 className={cn('mt-5 text-[13px] font-semibold', skin.strong)}>
            <Dyn>Other charges</Dyn>
          </h4>
          <ul className={cn('mt-2 divide-y border-y', skin.line)}>
            {rental.charges.map((charge) => (
              <li key={charge.id} className={cn('flex items-center justify-between gap-3 py-3 text-[13px]', skin.line)}>
                <div className="min-w-0">
                  <div className={cn('font-medium', skin.strong)}><Dyn>{charge.label}</Dyn></div>
                  {charge.description ? <div className={cn('mt-0.5 truncate text-[11.5px]', skin.quiet)}><Dyn>{charge.description}</Dyn></div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('font-medium tabular-nums', skin.strong)}>{money(Number(charge.amount))}</span>
                  {charge.receipt_url ? (
                    <a href={charge.receipt_url} target="_blank" rel="noreferrer" className={cn('font-semibold', skin.link)}>
                      <Dyn>View receipt</Dyn>
                    </a>
                  ) : null}
                  {Number(charge.outstanding) > 0 ? (
                    <button type="button" onClick={pay.handlePay} disabled={pay.payLoading} className={cn('font-semibold disabled:opacity-60', skin.link)}>
                      <Dyn>Pay now</Dyn>
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className={skin.quiet}>
          <Dyn>Card on file</Dyn>: <span className={skin.strong}>{rental.card_on_file?.label ?? <Dyn>None</Dyn>}</span>
        </span>
        {!rental.closed ? (
          <button type="button" onClick={onUpdateCard} className={cn('font-semibold', skin.link)}>
            <Dyn>{rental.card_on_file ? 'Update card' : 'Add a card'}</Dyn>
          </button>
        ) : null}
      </div>

      {!rental.closed ? (
        <div className={cn('mt-4 border-t pt-4', skin.line)}>
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
    </section>
  );
}
