import type { RateCard } from '@/lib/rate-card';
import type { Vehicle } from '@/types/vehicle';

export const HOURLY_MAX_HOURS = 23;

export interface CardPricing {
  mode: 'idle' | 'hourly' | 'daily' | 'weekly';
  unit: 'hr' | 'day' | 'week';
  basePrice: number;
  unitPrice: number;
  units: number;
  total: number;
  discounted: boolean;
}

export function cardPricing(
  vehicle: Pick<Vehicle, 'pricePerHour'>,
  card: RateCard,
  hours?: number,
  discountPct?: number,
): CardPricing {
  if (card.headline.per === 'week') {
    const price = card.headline.price;
    return { mode: 'weekly', unit: 'week', basePrice: price, unitPrice: price, units: 0, total: 0, discounted: false };
  }
  const perDay = card.headline.price;
  const perHour = Number(vehicle.pricePerHour) || 0;
  if (!hours || hours <= 0) {
    return { mode: 'idle', unit: 'day', basePrice: perDay, unitPrice: perDay, units: 0, total: 0, discounted: false };
  }
  const hourly = hours <= HOURLY_MAX_HOURS && perHour > 0;
  const basePrice = hourly ? perHour : perDay;
  const units = Math.max(1, Math.ceil(hourly ? hours : hours / 24));
  const pct = Number(discountPct) || 0;
  const discounted = pct > 0 && pct < 100;
  const unitPrice = discounted ? basePrice * (1 - pct / 100) : basePrice;
  return { mode: hourly ? 'hourly' : 'daily', unit: hourly ? 'hr' : 'day', basePrice, unitPrice, units, total: unitPrice * units, discounted };
}
