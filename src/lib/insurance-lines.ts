import { money } from '@/lib/utils';

export interface InsuranceLine {
  label: string;
  sub: string;
  amount: number;
}

export function insuranceCoverageLines(
  coverages:
    | { name: string; daily: number; days: number; amount: number }[]
    | undefined,
): InsuranceLine[] {
  return (coverages ?? []).map((c) => ({
    label: c.name,
    sub: `${money(c.daily)} × ${c.days} day${c.days === 1 ? '' : 's'}`,
    amount: c.amount,
  }));
}
