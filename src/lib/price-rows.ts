import { money } from '@/lib/utils';
import type { BookingPricing, TaxLine } from '@/hooks/useBookingInvoice';

export interface PriceRow {
  key: string;
  label: string;
  amount: number;
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

function taxLabel(line: TaxLine): string {
  if (line.kind === 'percentage') return `${line.name} (${line.percentage}%)`;
  if (line.kind === 'per_rental' || line.unit <= 0) return line.name;
  const count = Math.round((line.amount / line.unit) * 100) / 100;
  return Number.isInteger(count)
    ? `${line.name} · ${money(line.unit)} × ${plural(count, 'day')}`
    : `${line.name} · ${money(line.unit)}/day, capped`;
}

export function rateRows(pricing: BookingPricing): PriceRow[] {
  return pricing.rateLines.map((line, i) => ({ key: `rate-${i}`, label: line.label, amount: line.amount }));
}

export function taxRows(pricing: BookingPricing): PriceRow[] {
  return pricing.taxLines.map((line, i) => ({ key: `tax-${i}`, label: taxLabel(line), amount: line.amount }));
}

export function weeklySavingText(pricing: BookingPricing): string | null {
  return pricing.weeklySavings > 0 ? `You save ${money(pricing.weeklySavings)} with the weekly rate` : null;
}

export function depositNotice(amount: number, mode: BookingPricing['depositMode']): string {
  if (!(amount > 0)) return 'No security deposit';
  return mode === 'charge_refund'
    ? `${money(amount)} charged at checkout and refunded after return and inspection`
    : `${money(amount)} held on your card at pick-up, released after inspection`;
}

export function depositSummary(amount: number, mode: BookingPricing['depositMode']): string {
  if (!(amount > 0)) return 'No security deposit';
  return `${money(amount)} · ${mode === 'charge_refund' ? 'charged and refunded after return' : 'held on your card'}`;
}
