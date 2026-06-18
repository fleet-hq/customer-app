import { money } from './utils';

export type QuoteGroup = 'rental' | 'insurance' | 'addons' | 'discount';

export interface QuoteLine {
  group: QuoteGroup;
  label: string;
  sub?: string;
  amount: number;
  code?: string;
}

export interface Quote {
  lines: QuoteLine[];
  rental: number;
  planTotal: number;
  extrasTotal: number;
  discount: number;
  total: number;
}

export interface QuoteExtra {
  name: string;
  perDay: number;
  qty: number;
}

export interface QuoteInput {
  pricePerDay: number;
  days: number;
  plan?: { name: string; perDay: number } | null;
  extras?: QuoteExtra[];
  discount?: { code: string; pct: number } | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildQuote({ pricePerDay, days, plan, extras = [], discount }: QuoteInput): Quote {
  const lines: QuoteLine[] = [];

  const rental = round2(pricePerDay * days);
  lines.push({
    group: 'rental',
    label: 'Car rental',
    sub: `${money(pricePerDay)} × ${days} days`,
    amount: rental,
  });

  let planTotal = 0;
  if (plan && plan.perDay > 0) {
    planTotal = round2(plan.perDay * days);
    lines.push({
      group: 'insurance',
      label: plan.name,
      sub: `${money(plan.perDay)} × ${days} days`,
      amount: planTotal,
    });
  }

  let extrasTotal = 0;
  for (const extra of extras) {
    if (extra.qty <= 0) continue;
    const amount = round2(extra.perDay * days * extra.qty);
    extrasTotal += amount;
    lines.push({
      group: 'addons',
      label: `${extra.name}${extra.qty > 1 ? ` ×${extra.qty}` : ' ×1'}`,
      sub: `${money(extra.perDay)} × ${days} days${extra.qty > 1 ? ` × ${extra.qty}` : ''}`,
      amount,
    });
  }

  let discountAmount = 0;
  if (discount && discount.pct > 0) {
    discountAmount = round2(rental * (discount.pct / 100));
    lines.push({
      group: 'discount',
      label: 'Discount',
      code: discount.code,
      amount: -discountAmount,
    });
  }

  return {
    lines,
    rental,
    planTotal,
    extrasTotal,
    discount: discountAmount,
    total: round2(rental + planTotal + extrasTotal - discountAmount),
  };
}

export function linesByGroup(quote: Quote, group: QuoteGroup): QuoteLine[] {
  return quote.lines.filter((l) => l.group === group);
}
