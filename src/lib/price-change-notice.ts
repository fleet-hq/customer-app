import { money } from '@/lib/utils';

export type PriceNoticeTone = 'positive' | 'negative';

export interface PriceChangeNotice {
  tone: PriceNoticeTone;
  message: string;
}

const PCT_EPSILON = 0.5;
const RATE_EPSILON = 0.01;

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function discountPct(base: number, discounted: number): number {
  if (base <= 0) return 0;
  return ((base - discounted) / base) * 100;
}

function tidy(value: number): number {
  return Math.round(value * 10) / 10;
}

export function describePriceChange(preview: unknown): PriceChangeNotice | null {
  const p = preview as Record<string, any> | null;
  if (!p || p.allowed === false) return null;

  const before = p.original_breakdown;
  const after = p.new_breakdown;
  if (!before || !after) return null;

  const origDays = num(p.original_days);
  const newDays = num(p.new_days);
  const origBase = num(before.base_price);
  const newBase = num(after.base_price);
  const origPct = discountPct(origBase, num(before.discounted_price ?? before.base_price));
  const newPct = discountPct(newBase, num(after.discounted_price ?? after.base_price));

  if (newPct - origPct >= PCT_EPSILON) {
    const longerYetCheaper = newDays > origDays && num(p.price_difference) < 0;
    return {
      tone: 'positive',
      message: longerYetCheaper
        ? `Your new dates qualify for a ${tidy(newPct)}% multi-day discount instead of ${tidy(origPct)}%, so the longer trip costs less than your original one.`
        : `Your new dates qualify for a ${tidy(newPct)}% multi-day discount, up from ${tidy(origPct)}%.`,
    };
  }

  if (origPct - newPct >= PCT_EPSILON) {
    return {
      tone: 'negative',
      message:
        newPct <= 0
          ? `Your new dates no longer qualify for the ${tidy(origPct)}% multi-day discount.`
          : `Your new dates qualify for a ${tidy(newPct)}% multi-day discount instead of ${tidy(origPct)}%.`,
    };
  }

  const origRate = origDays > 0 ? origBase / origDays : 0;
  const newRate = newDays > 0 ? newBase / newDays : 0;
  if (origRate > 0 && newRate > 0 && Math.abs(newRate - origRate) > RATE_EPSILON) {
    const dearer = newRate > origRate;
    return {
      tone: dearer ? 'negative' : 'positive',
      message: dearer
        ? `Some of your new dates are priced higher than your original ones — ${money(newRate)} a day on average, against ${money(origRate)} before.`
        : `Some of your new dates are priced lower than your original ones — ${money(newRate)} a day on average, against ${money(origRate)} before.`,
    };
  }

  return null;
}
