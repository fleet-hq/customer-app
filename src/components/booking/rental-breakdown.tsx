'use client';

import { money } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import { Dyn } from '@/components/i18n/Dyn';
import { rateRows, weeklySavingText } from '@/lib/price-rows';
import type { BookingPricing } from '@/hooks/useBookingInvoice';
import type { DailyRate } from '@/types/vehicle';

interface RentalBreakdownProps {
  pricing: BookingPricing;
  dailyRates?: DailyRate[] | null;
}

export function RentalBreakdown({ pricing, dailyRates }: RentalBreakdownProps) {
  const isT2 = useIsT2();
  const strong = isT2 ? 'text-[var(--text)]' : 'text-ink';
  const quiet = isT2 ? 'text-[var(--text-muted)]' : 'text-muted';
  const faint = isT2 ? 'text-[var(--text-muted)]' : 'text-faint';
  const saving = isT2 ? 'text-[var(--brass)]' : 'text-primary';

  const rows = rateRows(pricing);
  const perDay = pricing.weeklyApplied ? null : deriveDailyBreakdown(pricing.rateUnit, dailyRates);
  const savingText = weeklySavingText(pricing);

  return (
    <div aria-busy={pricing.stale} className={pricing.stale ? 'opacity-50 transition-opacity' : undefined}>
      <div className="flex items-start justify-between text-[13px]">
        <div>
          <div className={cn('font-medium', strong)}><Dyn>Car rental</Dyn></div>
          {rows.length === 1 && !perDay ? (
            <div className={cn('mt-px text-[11.5px]', quiet)}>{rows[0].label}</div>
          ) : null}
        </div>
        <span className={cn('font-medium', strong)}>{money(pricing.rentalTotal)}</span>
      </div>
      {perDay ? (
        <div className="mt-[8px] flex flex-col gap-[6px]">
          {perDay.map((d) => (
            <div key={d.date} className="flex items-baseline justify-between text-[12px]">
              <span className={quiet}>
                {d.weekday} {formatShort(d.date)}
                {d.isDynamic && (
                  <span className={cn('ml-1.5 text-[11px]', faint)}>
                    <Dyn>(custom rate)</Dyn>
                  </span>
                )}
              </span>
              <span className={cn('font-medium tabular-nums', strong)}>{money(d.rate)}</span>
            </div>
          ))}
        </div>
      ) : rows.length > 1 ? (
        <div className="mt-[8px] flex flex-col gap-[6px]">
          {rows.map((row) => (
            <div key={row.key} className="flex items-baseline justify-between text-[12px]">
              <span className={quiet}>{row.label}</span>
              <span className={cn('font-medium tabular-nums', strong)}>{money(row.amount)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {savingText ? (
        <div className={cn('mt-[8px] text-[12px] font-semibold', saving)}><Dyn>{savingText}</Dyn></div>
      ) : null}
    </div>
  );
}

function deriveDailyBreakdown(
  rateUnit: BookingPricing['rateUnit'],
  dailyRates: DailyRate[] | null | undefined,
): DailyRate[] | null {
  if (rateUnit !== 'day' || !Array.isArray(dailyRates)) return null;
  const usable = dailyRates.filter((d) => Number.isFinite(d.rate));
  if (!usable.some((d) => d.isDynamic)) return null;
  return usable;
}

function formatShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
