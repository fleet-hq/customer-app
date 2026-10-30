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
  strikePrice: number | null;
}

export function cardPricing(
  vehicle: Pick<Vehicle, 'pricePerHour' | 'basePricePerDay' | 'isDynamicPricing'>,
  card: RateCard,
  hours?: number,
  discountPct?: number,
): CardPricing {
  if (card.headline.per === 'week') {
    const price = card.headline.price;
    return { mode: 'weekly', unit: 'week', basePrice: price, unitPrice: price, units: 0, total: 0, discounted: false, strikePrice: null };
  }
  const perDay = card.headline.price;
  const perHour = Number(vehicle.pricePerHour) || 0;
  const base = Number(vehicle.basePricePerDay) || 0;
  const dynamicBase = vehicle.isDynamicPricing && base > 0 && base !== perDay ? base : null;
  if (!hours || hours <= 0) {
    return { mode: 'idle', unit: 'day', basePrice: perDay, unitPrice: perDay, units: 0, total: 0, discounted: false, strikePrice: dynamicBase };
  }
  const hourly = hours <= HOURLY_MAX_HOURS && perHour > 0;
  const basePrice = hourly ? perHour : perDay;
  const units = Math.max(1, Math.ceil(hourly ? hours : hours / 24));
  const pct = Number(discountPct) || 0;
  const discounted = pct > 0 && pct < 100;
  const unitPrice = discounted ? basePrice * (1 - pct / 100) : basePrice;
  const strikePrice = discounted ? basePrice : hourly ? null : dynamicBase;
  return { mode: hourly ? 'hourly' : 'daily', unit: hourly ? 'hr' : 'day', basePrice, unitPrice, units, total: unitPrice * units, discounted, strikePrice };
}
