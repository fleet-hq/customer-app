export const NA = 'N/A';

export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function money(value: unknown): string {
  return `$${num(value).toFixed(2)}`;
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
