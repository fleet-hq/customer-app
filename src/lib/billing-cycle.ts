import { money } from '@/lib/utils';
import type { BillingCycle } from '@/services/rentalServices';

export const WEEKS_PER_MONTH = 365 / 12 / 7;

export interface Renewal {
  renew_weekday_name?: string | null;
  renew_day?: number | null;
}

export interface CycleWords {
  badge: string;
  firstPeriod: string;
  rentalTitle: string;
  span: string;
  rentalLine: (weeklyRate: number | null) => string;
  renews: (renewal: Renewal) => string;
  recurringNote: string;
  blurb: string;
  weeksPerCycle: number;
}

const CYCLES: Record<BillingCycle, CycleWords> = {
  weekly: {
    badge: 'Weekly',
    firstPeriod: 'Week 1',
    rentalTitle: 'Weekly rental',
    span: 'weekly',
    rentalLine: () => 'Weekly rate',
    renews: ({ renew_weekday_name }) => `Then every ${renew_weekday_name ?? ''}`,
    recurringNote: 'until you return the car',
    blurb: 'Charged every 7 days. Most flexible for drivers whose earnings change week to week.',
    weeksPerCycle: 1,
  },
  biweekly: {
    badge: 'Every 2 weeks',
    firstPeriod: 'Weeks 1–2',
    rentalTitle: 'Rental billed every two weeks',
    span: 'every two weeks',
    rentalLine: (weeklyRate) => (weeklyRate ? `2 weeks × ${money(weeklyRate)}` : 'Two-week rate'),
    renews: ({ renew_weekday_name }) => `Then every other ${renew_weekday_name ?? ''}`,
    recurringNote: 'every two weeks, until you return the car',
    blurb: 'Charged every 14 days. Lines up with most rideshare payout cycles.',
    weeksPerCycle: 2,
  },
  monthly: {
    badge: 'Monthly',
    firstPeriod: 'Month 1',
    rentalTitle: 'Monthly rental',
    span: 'monthly',
    rentalLine: () => 'Monthly rate',
    renews: ({ renew_day }) => (renew_day ? `Then on day ${renew_day} of each month` : 'Then monthly'),
    recurringNote: 'each month, until you return the car',
    blurb: 'Charged once a month. Lowest rate and fewest charges.',
    weeksPerCycle: 365 / 12 / 7,
  },
};

const isBillingCycle = (cycle: string | null | undefined): cycle is BillingCycle => !!cycle && Object.hasOwn(CYCLES, cycle);

export function cycleWords(cycle: string | null | undefined): CycleWords {
  return CYCLES[isBillingCycle(cycle) ? cycle : 'weekly'];
}

export function cycleInfo(cycle: string): CycleWords | null {
  return (CYCLES as Record<string, CycleWords>)[cycle] ?? null;
}
