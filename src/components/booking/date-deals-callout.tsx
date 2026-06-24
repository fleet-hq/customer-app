'use client';

import { useFleetDiscountsSummary } from '@/hooks/useFleetDiscounts';

const WEEK_DAYS = 7;

interface DateDealsCalloutProps {
  days: number;
  isPeakPricing?: boolean;
  isPromoPricing?: boolean;
  className?: string;
}

export function DateDealsCallout({
  days,
  isPeakPricing,
  isPromoPricing,
  className,
}: DateDealsCalloutProps) {
  const { data: discountsSummary } = useFleetDiscountsSummary();
  const bestWeeklyPct = (discountsSummary?.tiers ?? [])
    .filter((t) => t.unit_type === 'week')
    .reduce((m, t) => (t.percentage > m ? t.percentage : m), 0);

  const hasWeekly = bestWeeklyPct > 0;
  const earnedWeekly = hasWeekly && days >= WEEK_DAYS;
  const showAny = isPeakPricing || isPromoPricing || hasWeekly;
  if (!showAny) return null;

  return (
    <div className={['flex flex-col gap-[10px]', className].filter(Boolean).join(' ')}>
      {isPeakPricing && (
        <CalloutLine
          tone="amber"
          text="Peak-day pricing is in effect for the selected dates."
        />
      )}
      {isPromoPricing && (
        <CalloutLine
          tone="success"
          text="Promo pricing is in effect for the selected dates."
        />
      )}
      {hasWeekly &&
        (earnedWeekly ? (
          <CalloutLine
            tone="success"
            title="You've unlocked our best weekly rate."
            text={`Up to ${bestWeeklyPct}% off the daily rate on this ${days}-day rental.`}
          />
        ) : (
          <CalloutLine
            tone="primary"
            title={`Add ${WEEK_DAYS - days} more ${WEEK_DAYS - days === 1 ? 'day' : 'days'} to save up to ${bestWeeklyPct}% per day.`}
            text={`Rent 1+ weeks and up to ${bestWeeklyPct}% comes off the daily rate.`}
          />
        ))}
    </div>
  );
}

const TONE_CLASSES: Record<'amber' | 'success' | 'primary', string> = {
  amber: 'border-amber-border bg-amber-bg text-amber-text-2',
  success: 'border-green-border-2 bg-green-bg text-success',
  primary: 'border-primary-border bg-primary-soft text-primary',
};

function CalloutLine({
  tone,
  title,
  text,
}: {
  tone: 'amber' | 'success' | 'primary';
  title?: string;
  text: string;
}) {
  return (
    <div
      className={`rounded-[9px] border px-3 py-[9px] text-[11.5px] leading-[1.45] font-medium ${TONE_CLASSES[tone]}`}
    >
      {title && <div className="font-semibold text-secondary">{title}</div>}
      <div className={title ? 'mt-px' : ''}>{text}</div>
    </div>
  );
}
