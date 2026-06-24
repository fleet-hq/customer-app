'use client';

import { money } from '@/lib/utils';
import type { DailyRate } from '@/types/vehicle';

interface RentalBreakdownProps {
  rateUnit: 'hour' | 'day';
  pricePerHour: number;
  rentalHours: number;
  pricePerDay: number;
  days: number;
  dailyRates?: DailyRate[] | null;
  total: number;
}

export function RentalBreakdown({
  rateUnit,
  pricePerHour,
  rentalHours,
  pricePerDay,
  days,
  dailyRates,
  total,
}: RentalBreakdownProps) {
  const breakdown = deriveDailyBreakdown(rateUnit, dailyRates);
  const summary = formatRentalSummary(rateUnit, pricePerHour, rentalHours, pricePerDay, days);

  if (breakdown) {
    return (
      <div>
        <div className="flex items-start justify-between text-[13px]">
          <div className="font-medium text-ink">Car rental</div>
          <span className="font-medium text-ink">{money(total)}</span>
        </div>
        <div className="mt-[8px] flex flex-col gap-[6px]">
          {breakdown.map((d) => (
            <div key={d.date} className="flex items-baseline justify-between text-[12px]">
              <span className="text-muted">
                {d.weekday} {formatShort(d.date)}
                {d.isDynamic && (
                  <span className="ml-1.5 text-[10.5px] text-faint">(custom rate)</span>
                )}
              </span>
              <span className="font-medium text-ink tabular-nums">{money(d.rate)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between text-[13px]">
      <div>
        <div className="font-medium text-ink">Car rental</div>
        <div className="mt-px text-[11.5px] text-muted">{summary}</div>
      </div>
      <span className="font-medium text-ink">{money(total)}</span>
    </div>
  );
}

function deriveDailyBreakdown(
  rateUnit: RentalBreakdownProps['rateUnit'],
  dailyRates: DailyRate[] | null | undefined,
): DailyRate[] | null {
  if (rateUnit !== 'day' || !Array.isArray(dailyRates)) return null;
  const usable = dailyRates.filter((d) => Number.isFinite(d.rate));
  if (!usable.some((d) => d.isDynamic)) return null;
  return usable;
}

function formatRentalSummary(
  rateUnit: RentalBreakdownProps['rateUnit'],
  pricePerHour: number,
  rentalHours: number,
  pricePerDay: number,
  days: number,
): string {
  if (rateUnit === 'hour') {
    return `${money(pricePerHour)} × ${rentalHours} ${rentalHours === 1 ? 'hour' : 'hours'}`;
  }
  return `${money(pricePerDay)} × ${days} ${days === 1 ? 'day' : 'days'}`;
}

function formatShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
