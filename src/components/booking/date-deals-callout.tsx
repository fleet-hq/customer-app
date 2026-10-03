'use client';

import { useFleetDiscountsSummary } from '@/hooks/useFleetDiscounts';
import { Dyn } from '@/components/i18n/Dyn';
import { useTenant } from '@/lib/tenant-context';

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
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
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
          isT2={isT2}
        />
      )}
      {isPromoPricing && (
        <CalloutLine
          tone="success"
          text="Promo pricing is in effect for the selected dates."
          isT2={isT2}
        />
      )}
      {hasWeekly &&
        (earnedWeekly ? (
          <CalloutLine
            tone="success"
            title="You've unlocked our best weekly rate."
            text={`Up to ${bestWeeklyPct}% off the daily rate on this ${days}-day rental.`}
            isT2={isT2}
          />
        ) : (
          <CalloutLine
            tone="primary"
            title={`Add ${WEEK_DAYS - days} more ${WEEK_DAYS - days === 1 ? 'day' : 'days'} to save up to ${bestWeeklyPct}% per day.`}
            text={`Rent 1+ weeks and up to ${bestWeeklyPct}% comes off the daily rate.`}
            isT2={isT2}
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

const TONE_CLASSES_T2: Record<'amber' | 'success' | 'primary', string> = {
  amber: 'border-[color-mix(in_srgb,var(--danger)_35%,var(--line-strong))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--card))] text-[var(--danger)]',
  success: 'border-[color-mix(in_srgb,var(--success)_35%,var(--line-strong))] bg-[color-mix(in_srgb,var(--success)_8%,var(--card))] text-[var(--success)]',
  primary: 'border-[color-mix(in_srgb,var(--brass)_35%,var(--line-strong))] bg-[color-mix(in_srgb,var(--brass)_8%,var(--card))] text-[var(--brass)]',
};

function CalloutLine({
  tone,
  title,
  text,
  isT2,
}: {
  tone: 'amber' | 'success' | 'primary';
  title?: string;
  text: string;
  isT2: boolean;
}) {
  return (
    <div
      className={`rounded-[9px] border px-3 py-[9px] text-[11.5px] leading-[1.45] font-medium ${isT2 ? TONE_CLASSES_T2[tone] : TONE_CLASSES[tone]}`}
    >
      {title && (
        <div className={isT2 ? 'font-semibold text-[var(--text)]' : 'font-semibold text-secondary'}>
          <Dyn>{title}</Dyn>
        </div>
      )}
      <div className={title ? 'mt-px' : ''}><Dyn>{text}</Dyn></div>
    </div>
  );
}
