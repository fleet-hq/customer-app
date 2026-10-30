import { money } from '@/lib/utils';
import type { RenterRental } from '@/services/rentalServices';

export interface RentalStat {
  key: string;
  label: string;
  value: string;
  note: string;
  due?: boolean;
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

const dayBefore = (iso: string) => {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d;
};

const daysBetween = (from: Date, to: Date) =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));

export function outstandingTotal(rental: RenterRental): number {
  const periods = rental.periods.reduce((sum, p) => sum + (Number(p.outstanding) || 0), 0);
  const charges = rental.charges.reduce((sum, c) => sum + (Number(c.outstanding) || 0), 0);
  return periods + charges;
}

export function rentalStats(rental: RenterRental, deposit: number): RentalStat[] {
  const renewal = rental.next_renewal;
  const scheduled = renewal.state === 'scheduled' && !!renewal.at;
  const amount = renewal.amount ?? rental.recurring_amount;
  const card = rental.card_on_file?.label;

  const nextCharge: RentalStat = rental.ended_at
    ? { key: 'next', label: 'Next charge', value: 'None', note: `Ended ${day(rental.ended_at)}` }
    : rental.closed
      ? { key: 'next', label: 'Next charge', value: 'None', note: 'No further payments will be taken' }
      : scheduled
        ? {
            key: 'next',
            label: 'Next charge',
            value: amount ? money(Number(amount)) : '—',
            note: [day(renewal.at!), card].filter(Boolean).join(' · '),
          }
        : {
            key: 'next',
            label: 'Next charge',
            value: '—',
            note:
              renewal.state === 'paused'
                ? 'Billing is paused'
                : renewal.state === 'on_hold'
                  ? 'On hold until the balance is paid'
                  : 'Not scheduled',
          };

  const paidThrough: RentalStat = scheduled
    ? (() => {
        const through = dayBefore(renewal.at!);
        const left = daysBetween(new Date(), new Date(renewal.at!));
        return {
          key: 'through',
          label: 'Paid through',
          value: through.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
          note: `${left} day${left === 1 ? '' : 's'} left this cycle`,
        };
      })()
    : { key: 'through', label: 'Paid through', value: '—', note: 'No cycle running' };

  const owed = outstandingTotal(rental);
  const unpaid =
    rental.periods.filter((p) => Number(p.outstanding) > 0).length +
    rental.charges.filter((c) => Number(c.outstanding) > 0).length;

  return [
    nextCharge,
    paidThrough,
    {
      key: 'balance',
      label: 'Balance due',
      value: money(owed),
      note: owed > 0 ? `${unpaid} item${unpaid === 1 ? '' : 's'} unpaid` : 'You’re all paid up',
      due: owed > 0,
    },
    {
      key: 'deposit',
      label: 'Deposit held',
      value: money(deposit),
      note: deposit > 0 ? 'Refundable at return' : 'No deposit held',
    },
  ];
}
