import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { VehicleExtra } from '@/types/vehicle';
import { getBookingQuote, type BookingQuote, type QuotePayload } from '@/services/bookingServices';
import { useDebounce } from './use-debounce';
import { extractApiErrorMessage } from '@/lib/api-errors';


export type RateUnit = 'day' | 'hour';

export interface InvoiceItem {
  image: string;
  name: string;
  licensePlate: string;
  quantity: number;
  unitPrice: number;
  unit: RateUnit;
  pricePerDay?: number;
  periodLabel?: string;
}

export interface ExtraInvoiceItem {
  name: string;
  price: number;
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface TaxLine {
  name: string;
  amount: number;
  kind: 'percentage' | 'per_day' | 'per_rental';
  unit: number;
  percentage: number;
  includesFixed: boolean;
}

export interface BookingPricing {
  subtotal: number;
  stale: boolean;
  insuranceCost: number;
  extrasCost: number;
  locationCharges: number;
  discount: number;
  fleetDiscount: number;
  fleetDiscountTier: {
    unitType: 'day' | 'hour' | 'week';
    units: number;
    percentage: number;
  } | null;
  tax: number;
  total: number;
  deposit: number;
  depositMode: 'hold' | 'charge_refund';
  bookingFee: number;
  rateUnit: RateUnit;
  rentalTotal: number;
  rateLines: PriceLine[];
  weeklyApplied: boolean;
  weeklySavings: number;
  taxLines: TaxLine[];
  days: number;
}

type Discount = { unitType: string; units: number; percentage: number };

export interface UseBookingInvoiceParams {
  quotePayload: QuotePayload | null;
  vehicleData: {
    image: string;
    name: string;
    licensePlate: string;
    pricePerDay: number;
    discounts?: Discount[];
    extras: VehicleExtra[];
  } | null;
  selectedInsurance: Set<string>;
  selectedExtras: Record<string, { enabled: boolean; quantity: number }>;
  appliedDiscount: number;
}

export interface BookingInvoiceResult {
  pricing: BookingPricing;
  invoiceItems: InvoiceItem[];
  extraInvoiceItems: ExtraInvoiceItem[];
  extrasById: Record<string, number>;
  insuranceLabel: string;
  quote: BookingQuote | undefined;
  quoteError: string | null;
}

const num = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const EMPTY: BookingPricing = {
  subtotal: 0, stale: true, insuranceCost: 0, extrasCost: 0, locationCharges: 0,
  discount: 0, fleetDiscount: 0, fleetDiscountTier: null, tax: 0, total: 0,
  deposit: 0, depositMode: 'hold', bookingFee: 0, rateUnit: 'day', rentalTotal: 0,
  rateLines: [], weeklyApplied: false, weeklySavings: 0, taxLines: [], days: 0,
};

function taxLinesFrom(quote: BookingQuote): TaxLine[] {
  return (quote.breakdown.tax_details?.tax_breakdown ?? [])
    .map((line) => ({
      name: line.tax_name,
      amount: num(line.tax_amount),
      kind: (line.tax_type === 'percentage'
        ? 'percentage'
        : line.trip_type === 'per_day'
          ? 'per_day'
          : 'per_rental') as TaxLine['kind'],
      unit: num(line.fixed_amount),
      percentage: num(line.percentage),
      includesFixed: !!line.includes_fixed,
    }))
    .filter((line) => line.amount !== 0);
}

function bestTier(
  discounts: Discount[] | undefined,
  fleetDiscount: number,
  days: number,
): BookingPricing['fleetDiscountTier'] {
  if (fleetDiscount <= 0 || !discounts?.length) return null;
  const weeks = Math.floor(days / 7);
  const fits = discounts.filter((d) =>
    d.unitType === 'week' ? weeks > 0 && d.units <= weeks : d.unitType === 'day' && d.units <= days,
  );
  const top = fits.sort((a, b) => b.percentage - a.percentage)[0];
  return top ? { unitType: top.unitType as 'day' | 'week', units: top.units, percentage: top.percentage } : null;
}

export function useBookingInvoice({
  quotePayload,
  vehicleData,
  selectedInsurance,
  selectedExtras,
  appliedDiscount,
}: UseBookingInvoiceParams): BookingInvoiceResult {
  const payload = useDebounce(quotePayload, 250);
  const pending = JSON.stringify(payload) !== JSON.stringify(quotePayload);
  const { data: lastQuote, isFetching, error } = useQuery({
    queryKey: ['booking-quote', payload],
    queryFn: () => getBookingQuote(payload!),
    enabled: !!payload,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  });
  const quoteError = error && !pending && !isFetching ? extractApiErrorMessage(error, "These dates can't be booked.") : null;
  const quote = quoteError ? undefined : lastQuote;

  const pricing = useMemo<BookingPricing>(() => {
    if (!quote) return EMPTY;
    const b = quote.breakdown;
    const days = num(b.booking_days);
    const lines = (b.rate_lines ?? []).map((line) => ({ label: line.label, amount: num(line.amount) }));
    const fleetDiscount = num(b.fleet_discount);
    const insuranceCost = num(quote.insurance_premium) + num(b.manual_insurance_total);
    const extrasCost = num(b.extras_price);
    const rentalTotal = num(b.base_price);
    const hourly = (b.rate_lines ?? [])[0]?.unit === 'hr';
    return {
      stale: pending || isFetching,
      subtotal: rentalTotal + insuranceCost + extrasCost,
      insuranceCost,
      extrasCost,
      locationCharges: num(b.location_charges),
      discount: fleetDiscount + appliedDiscount,
      fleetDiscount,
      fleetDiscountTier: bestTier(vehicleData?.discounts, fleetDiscount, days),
      tax: num(b.tax),
      total: num(quote.total) - num(quote.abi_premium),
      deposit: num(quote.deposit.amount),
      depositMode: quote.deposit.mode,
      bookingFee: num(b.fees),
      rateUnit: hourly ? 'hour' : 'day',
      rentalTotal,
      rateLines: lines.filter((line) => line.amount >= 0),
      weeklyApplied: !!b.weekly_applied,
      weeklySavings: num(b.weekly_savings),
      taxLines: taxLinesFrom(quote),
      days,
    };
  }, [quote, pending, isFetching, appliedDiscount, vehicleData?.discounts]);

  const extras = vehicleData?.extras ?? [];
  const extraInvoiceItems = useMemo<ExtraInvoiceItem[]>(() => {
    const byId = quote?.breakdown.extras_by_id ?? {};
    return extras
      .filter((extra) => selectedExtras[extra.id]?.enabled)
      .map((extra) => ({ name: extra.title, price: num(byId[extra.id]) }));
  }, [quote, extras, selectedExtras]);

  const extrasById = useMemo<Record<string, number>>(() => {
    const byId = quote?.breakdown.extras_by_id ?? {};
    return Object.fromEntries(Object.entries(byId).map(([id, amount]) => [id, num(amount)]));
  }, [quote]);

  const invoiceItems = useMemo<InvoiceItem[]>(() => {
    if (!vehicleData || !quote) return [];
    const first = quote.breakdown.rate_lines?.[0];
    return [
      {
        image: vehicleData.image,
        name: `${vehicleData.name}${vehicleData.licensePlate ? ` - ${vehicleData.licensePlate}` : ''}`,
        licensePlate: vehicleData.licensePlate,
        quantity: first ? num(first.quantity) : pricing.days,
        unitPrice: first ? num(first.unit_price) : vehicleData.pricePerDay,
        unit: pricing.rateUnit,
        pricePerDay: vehicleData.pricePerDay,
      },
    ];
  }, [vehicleData, quote, pricing.days, pricing.rateUnit]);

  const insuranceLabel = useMemo(() => {
    if (selectedInsurance.size > 0 && !selectedInsurance.has('own')) {
      return [...selectedInsurance].map((id) => id.toUpperCase()).join(', ');
    }
    return '';
  }, [selectedInsurance]);

  return { pricing, invoiceItems, extraInvoiceItems, extrasById, insuranceLabel, quote, quoteError };
}
