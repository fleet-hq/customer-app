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
  },
  biweekly: {
    badge: 'Every 2 weeks',
    firstPeriod: 'Weeks 1–2',
    rentalTitle: 'Rental billed every two weeks',
    span: 'every two weeks',
    rentalLine: (weeklyRate) => (weeklyRate ? `2 weeks × ${money(weeklyRate)}` : 'Two-week rate'),
    renews: ({ renew_weekday_name }) => `Then every other ${renew_weekday_name ?? ''}`,
    recurringNote: 'every two weeks, until you return the car',
  },
  monthly: {
    badge: 'Monthly',
    firstPeriod: 'Month 1',
    rentalTitle: 'Monthly rental',
    span: 'monthly',
    rentalLine: () => 'Monthly rate',
    renews: ({ renew_day }) => (renew_day ? `Then on day ${renew_day} of each month` : 'Then monthly'),
    recurringNote: 'each month, until you return the car',
  },
};

const isBillingCycle = (cycle: string | null | undefined): cycle is BillingCycle => !!cycle && Object.hasOwn(CYCLES, cycle);

export function cycleWords(cycle: string | null | undefined): CycleWords {
  return CYCLES[isBillingCycle(cycle) ? cycle : 'weekly'];
}
