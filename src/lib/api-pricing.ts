export type RateUnit = 'day' | 'hour';

export interface BasePriceResult {
  /** Total base price (subtotal before extras/fees/tax) */
  total: number;
  /** Which rate was applied — drives the invoice display */
  unit: RateUnit;
  /** Quantity in the chosen unit (days or hours) */
  quantity: number;
  /** Per-unit price */
  unitPrice: number;
}

/** Bookings of 23 hours or less use the hourly rate (when available). */
const HOURLY_RATE_MAX_HOURS = 23;

interface CalculateBasePriceArgs {
  pricePerDay: number;
  pricePerHour: number;
  rentalDays: number;
  rentalHours: number;
  autoCapEnabled?: boolean;
  /** The per-day rates the API resolved for this exact window, peak
   *  days included. Present whenever the vehicle was fetched with
   *  dates. */
  dailyRates?: { rate: number }[] | null;
}

/**
 * Mirrors the backend `BasePriceCalculator.calculate()` logic so the
 * customer sees the same total as the backend will compute. The backend
 * remains the source of truth — this is for UI preview only.
 *
 * Rules:
 * - 23 hours or less → hourly rate (if available, else daily)
 * - 24 hours or more → daily rate (if available, else hourly)
 * - Both rates configured AND autoCapEnabled AND hourly subtotal >= daily
 *   → cap at one day's daily rate (no calendar-day multiplication)
 */
export function calculateBasePrice({
  pricePerDay,
  pricePerHour,
  rentalDays,
  rentalHours,
  autoCapEnabled = true,
  dailyRates,
}: CalculateBasePriceArgs): BasePriceResult {
  const hasDaily = pricePerDay > 0;
  const hasHourly = pricePerHour > 0;

  if (rentalHours <= HOURLY_RATE_MAX_HOURS && hasHourly) {
    const hourlyTotal = pricePerHour * rentalHours;
    if (autoCapEnabled && hasDaily && hourlyTotal >= pricePerDay) {
      return { total: pricePerDay, unit: 'day', quantity: 1, unitPrice: pricePerDay };
    }
    return { total: hourlyTotal, unit: 'hour', quantity: rentalHours, unitPrice: pricePerHour };
  }

  if (hasDaily) {
    // ``pricePerDay`` is an average across the fetched window, so
    // multiplying it by a day count is only right while that window and
    // the selected one are the same. They come apart the moment the
    // renter edits a date — a 7-day average of 800 charged over 6 days
    // read $4,800 against per-day rows totalling $5,280 — and an average
    // cannot represent peak days anyway. Sum the rates when they cover
    // the selection; they are what the renter is shown.
    const rates = (dailyRates ?? []).map((d) => Number(d.rate)).filter(Number.isFinite);
    if (rates.length === rentalDays && rentalDays > 0) {
      const total = rates.reduce((sum, rate) => sum + rate, 0);
      return { total, unit: 'day', quantity: rentalDays, unitPrice: total / rentalDays };
    }
    return { total: pricePerDay * rentalDays, unit: 'day', quantity: rentalDays, unitPrice: pricePerDay };
  }

  if (hasHourly) {
    return { total: pricePerHour * rentalHours, unit: 'hour', quantity: rentalHours, unitPrice: pricePerHour };
  }

  return { total: 0, unit: 'day', quantity: rentalDays, unitPrice: 0 };
}
