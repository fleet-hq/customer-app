import { money as formatMoney } from '@/lib/utils';
import type { BookingDetails } from '@/services/bookingServices';
import type { AgreementData } from '@/services/agreementServices';

export const NA = 'N/A';

export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function money(value: unknown): string {
  return formatMoney(num(value));
}

export function agreementInvoice(booking: BookingDetails): AgreementData['invoice'] {
  const inv = booking.invoice;
  const hourly = inv.items[0]?.unit === 'hour' ? inv.items[0] : null;
  const coverage = booking.insuranceCoverage;
  const covers = coverage
    ? [coverage.cdw && 'CDW', coverage.rcli && 'RCLI', coverage.sli && 'SLI', coverage.pai && 'PAI'].filter(Boolean).join(', ')
    : '';
  const positive = (value: number) => (value > 0 ? money(value) : undefined);
  return {
    rentalTotal: hourly ? `${money(inv.rentalTotal)} (${hourly.quantity} hrs × ${money(hourly.pricePerDay)}/hr)` : money(inv.rentalTotal),
    fees: positive(inv.fees),
    discount: inv.discount > 0 ? `-${money(inv.discount)}` : undefined,
    insurance: coverage ? `${money(coverage.premiumAmount)}${covers ? ` (${covers})` : ''}` : undefined,
    tax: positive(inv.tax),
    total: money(inv.total),
    deposit: positive(inv.deposit),
  };
}

/** Mileage allowance as the agreement states it. Decimal fields arrive
 *  from the API as strings, so the amount is coerced before use. */
export function milesLabel(vehicle?: {
  milesUnlimited?: boolean;
  milesPerDay?: number | string | null;
} | null): string {
  if (vehicle?.milesUnlimited) return 'Unlimited';
  const perDay = num(vehicle?.milesPerDay);
  return perDay > 0 ? `${perDay} miles/day` : NA;
}

export function overageLabel(rate?: number | string | null): string {
  const amount = num(rate);
  return amount > 0 ? `${money(amount)}/mile` : '$0.00';
}
