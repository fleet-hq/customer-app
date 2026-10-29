import { money } from '@/lib/utils';
import type { BillingCycle } from '@/services/rentalServices';

export interface CycleWords {
  badge: string;
  firstPeriod: string;
  rentalTitle: string;
  span: string;
  rentalLine: (weeklyRate: number | null) => string;
  renews: (weekday: string, day?: number | null) => string;
  recurringNote: string;
}

const CYCLES: Record<BillingCycle, CycleWords> = {
  weekly: {
    badge: 'Weekly',
    firstPeriod: 'Week 1',
    rentalTitle: 'Weekly rental',
    span: 'weekly',
    rentalLine: () => 'Weekly rate',
    renews: (weekday) => `Then every ${weekday}`,
    recurringNote: 'until you return the car',
  },
  biweekly: {
    badge: 'Every 2 weeks',
    firstPeriod: 'Weeks 1–2',
    rentalTitle: 'Rental billed every two weeks',
    span: 'every two weeks',
    rentalLine: (weeklyRate) => (weeklyRate ? `2 weeks × ${money(weeklyRate)}` : 'Two-week rate'),
    renews: (weekday) => `Then every other ${weekday}`,
    recurringNote: 'every two weeks, until you return the car',
  },
  monthly: {
    badge: 'Monthly',
    firstPeriod: 'Month 1',
    rentalTitle: 'Monthly rental',
    span: 'monthly',
    rentalLine: () => 'Monthly rate',
    renews: (_weekday, day) => (day ? `Then on day ${day} of each month` : 'Then monthly'),
    recurringNote: 'each month, until you return the car',
  },
};

export function cycleWords(cycle: string | null | undefined): CycleWords {
  return CYCLES[(cycle as BillingCycle) in CYCLES ? (cycle as BillingCycle) : 'weekly'];
}
