import { cycleWords } from '@/lib/billing-cycle';
import { rentalStats, type RentalStat } from '@/lib/rental-stats';
import { money } from '@/lib/utils';
import type { RenterPeriod, RenterRental } from '@/services/rentalServices';

export type PaymentTone = 'paid' | 'due' | 'held' | 'quiet';

export interface DashboardRow {
  key: string;
  date: string;
  label: string;
  amount: string;
  status: string;
  tone: PaymentTone;
}

export interface GigDashboard {
  eyebrow: string;
  title: string;
  stateLabel: string;
  stats: RentalStat[];
  cycleBadge: string;
  cycleStart: string;
  cycleEnd: string;
  progress: number;
  nextChargeHeading: string;
  nextChargeTotal: string;
  autopayNote: string;
  rows: DashboardRow[];
  planHeading: string;
  planNote: string;
  carFacts: { label: string; value: string }[];
}

const DAY = 86400000;

const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';

const PERIOD_TONE: Record<string, PaymentTone> = {
  paid: 'paid',
  due: 'due',
  failed: 'due',
  partly_paid: 'due',
  waived: 'quiet',
  refunded: 'quiet',
  cancelled: 'quiet',
  scheduled: 'quiet',
};

function periodRow(period: RenterPeriod): DashboardRow {
  const overdue = period.overdue || Number(period.outstanding) > 0;
  return {
    key: `period-${period.id}`,
    date: shortDate(period.period_start),
    label: period.label,
    amount: money(Number(period.amount)),
    status: overdue && period.status !== 'paid' ? 'Due' : period.status.replace('_', ' '),
    tone: overdue && period.status !== 'paid' ? 'due' : PERIOD_TONE[period.status] ?? 'quiet',
  };
}

export function gigDashboard({
  rental,
  vehicleName,
  bookingRef,
  pickupAt,
  deposit,
  outstanding,
}: {
  rental: RenterRental;
  vehicleName: string;
  bookingRef: string;
  pickupAt: string | null;
  deposit: number;
  outstanding: number;
}): GigDashboard {
  const words = cycleWords(rental.billing_cycle);
  const planName = rental.plan?.name ?? (rental.rental_model === 'gig' ? 'Gig weekly plan' : 'Subscription');

  const started = pickupAt ? new Date(pickupAt).getTime() : null;
  const week = started ? Math.max(1, Math.floor((Date.now() - started) / DAY / 7) + 1) : 1;

  const current = rental.periods.find((p) => p.status !== 'paid') ?? rental.periods[rental.periods.length - 1];
  const from = current ? new Date(current.period_start).getTime() : null;
  const to = current ? new Date(current.period_end).getTime() : null;
  const progress =
    from && to && to > from ? Math.min(100, Math.max(0, Math.round(((Date.now() - from) / (to - from)) * 100))) : 0;

  const renewal = rental.next_renewal;
  const amount = renewal.amount ?? rental.recurring_amount;
  const card = rental.card_on_file?.label;
  const perWeek = amount && words.weeksPerCycle > 0 ? Number(amount) / words.weeksPerCycle : null;

  const stateLabel = rental.ended_at
    ? 'Ended'
    : rental.closed
      ? 'Closed'
      : rental.billing_state === 'paused'
        ? 'Paused'
        : rental.billing_state === 'on_hold'
          ? 'On hold'
          : renewal.state === 'ending'
            ? 'Ending'
            : 'Active';

  const rows: DashboardRow[] = [
    ...rental.charges.map((charge) => ({
      key: `charge-${charge.id}`,
      date: shortDate(charge.created_at ?? null),
      label: charge.label,
      amount: money(Number(charge.amount)),
      status: Number(charge.outstanding) > 0 ? 'Due' : 'Paid',
      tone: (Number(charge.outstanding) > 0 ? 'due' : 'paid') as PaymentTone,
    })),
    ...rental.periods.map(periodRow),
    ...(deposit > 0
      ? [
          {
            key: 'deposit',
            date: shortDate(pickupAt),
            label: 'Security deposit',
            amount: money(deposit),
            status: 'Held',
            tone: 'held' as PaymentTone,
          },
        ]
      : []),
  ];

  const notice = rental.return_notice_days
    ? `End any time with ${rental.return_notice_days} days' notice.`
    : 'End any time.';
  const minimum = rental.min_term_weeks
    ? rental.minimum_term_end_date && new Date(rental.minimum_term_end_date) <= new Date()
      ? `${rental.min_term_weeks}-week minimum met. `
      : `${rental.min_term_weeks}-week minimum. `
    : '';

  return {
    eyebrow: [planName, words.badge, bookingRef].filter(Boolean).join(' · '),
    title: `Week ${week} · ${vehicleName}`,
    stateLabel,
    stats: rentalStats(rental, deposit, outstanding),
    cycleBadge: words.badge,
    cycleStart: current ? shortDate(current.period_start) : '',
    cycleEnd: current ? shortDate(current.period_end) : '',
    progress,
    nextChargeHeading: renewal.at ? `Next charge · ${shortDate(renewal.at)}` : 'Next charge',
    nextChargeTotal: amount ? money(Number(amount)) : '—',
    autopayNote: [
      card ? `Autopay from ${card}.` : 'No card on file.',
      perWeek ? `About ${money(perWeek)} a week.` : null,
    ]
      .filter(Boolean)
      .join(' '),
    rows,
    planHeading: stateLabel === 'Active' ? 'Ongoing' : stateLabel,
    planNote: `${minimum}${notice}`,
    carFacts: [
      ...(pickupAt ? [{ label: 'Since', value: shortDate(pickupAt) }] : []),
      { label: 'Billing', value: words.badge },
      { label: 'Liability', value: rental.insurance_included ? 'Included' : 'Your own policy' },
    ],
  };
}
