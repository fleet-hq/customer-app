'use client';

import { Dyn } from '@/components/i18n/Dyn';
import { cn, money } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import { depositSummary, weeklyDepositTiming } from '@/lib/price-rows';
import { cycleWords, type CycleWords } from '@/lib/billing-cycle';
import type { OngoingOffer, PeriodPrice, RentalModel } from '@/services/rentalServices';

export interface WeeklyState {
  options: Exclude<RentalModel, 'daily'>[];
  model: Exclude<RentalModel, 'daily'> | null;
  on: boolean;
  canPickDate: boolean;
  unavailable: string | null;
  set: (next: boolean) => void;
  offer: OngoingOffer | null;
  reason: string | null;
  stale: boolean;
  cycle: CycleWords;
  consent: boolean;
  setConsent: (next: boolean) => void;
}

function modeLabel(model: Exclude<RentalModel, 'daily'>, cycle: CycleWords): string {
  return `${model === 'subscription' ? 'Subscription' : cycle.rentalTitle} · no fixed return`;
}

const OWN_POLICY = 'Your own insurance policy is required for weekly rentals';

const INSURANCE_NOTE: Record<string, string> = {
  own_rideshare_required: 'Your own rideshare insurance policy is required for weekly rentals',
  included_in_plan: 'Insurance is included in the weekly price',
};

const PERIOD_LINES: [keyof PeriodPrice, string][] = [
  ['extras', 'Add-ons'],
  ['location_charges', 'Pick-up and delivery'],
  ['booking_fee', 'Booking fee'],
  ['setup_fee', 'Setup fee'],
  ['tax', 'Taxes'],
];

function periodLines(period: PeriodPrice, offer: OngoingOffer): [string, string][] {
  const rental: [string, string][] = Number(period.rental) > 0
    ? [[cycleWords(offer.billing_cycle).rentalLine(offer.weekly_rate ? Number(offer.weekly_rate) : null), money(Number(period.rental))]]
    : [];
  return [
    ...rental,
    ...PERIOD_LINES.filter(([key]) => Number(period[key]) > 0).map(([key, label]): [string, string] => [label, money(Number(period[key]))]),
  ];
}

type Variant = 'tokens' | 'inherit';

const INHERIT = {
  strong: '',
  quiet: 'opacity-70',
  line: 'border-[color-mix(in_srgb,currentColor_25%,transparent)]',
  active: 'border-current bg-[color-mix(in_srgb,currentColor_10%,transparent)]',
  accent: 'accent-current',
};

function useSkin(variant: Variant) {
  const isT2 = useIsT2();
  if (variant === 'inherit') return INHERIT;
  return {
    strong: isT2 ? 'text-[var(--text)]' : 'text-ink',
    quiet: isT2 ? 'text-[var(--text-muted)]' : 'text-muted',
    line: isT2 ? 'border-[var(--line)]' : 'border-card-border',
    active: isT2 ? 'border-[var(--brass)] bg-[color-mix(in_srgb,var(--brass)_8%,var(--card))]' : 'border-primary bg-primary-soft',
    accent: isT2 ? 'accent-[var(--brass)]' : 'accent-primary',
  };
}

export function ReturnModeToggle({ weekly, variant = 'tokens' }: { weekly: WeeklyState; variant?: Variant }) {
  const skin = useSkin(variant);
  if (!weekly.canPickDate) return null;
  if (!weekly.model) {
    return weekly.unavailable ? (
      <p className={cn('text-[12px] leading-[1.5]', skin.quiet)}>
        <Dyn>{weekly.unavailable}</Dyn>
      </p>
    ) : null;
  }
  const options: [boolean, string][] = [
    [false, 'Pick a date'],
    [true, modeLabel(weekly.model, weekly.cycle)],
  ];
  return (
    <div role="radiogroup" aria-label="Return" className="flex flex-col gap-2">
      {options.map(([value, label]) => (
        <label
          key={label}
          className={cn(
            'flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-[13px]',
            weekly.on === value ? skin.active : skin.line,
            skin.strong,
          )}
        >
          <input
            type="radio"
            name="return-mode"
            checked={weekly.on === value}
            onChange={() => weekly.set(value)}
            className={cn('h-[14px] w-[14px]', skin.accent)}
          />
          <Dyn>{label}</Dyn>
        </label>
      ))}
    </div>
  );
}

export function WeeklyRentalSummary({ weekly, variant = 'tokens' }: { weekly: WeeklyState; variant?: Variant }) {
  const skin = useSkin(variant);
  const offer = weekly.offer;
  if (!offer) {
    return (
      <p className={cn('text-[13px] leading-[1.5]', skin.quiet)}>
        <Dyn>{weekly.reason ?? 'Working out your weekly price…'}</Dyn>
      </p>
    );
  }
  const terms = [
    offer.min_term_weeks ? `Minimum ${offer.min_term_weeks} weeks` : null,
    offer.return_notice_days ? `${offer.return_notice_days} days' notice to return` : null,
  ].filter(Boolean);
  const insurance = INSURANCE_NOTE[offer.insurance_mode] ?? OWN_POLICY;
  const deposit = Number(offer.deposit);
  const rows: { label: string; value: string; note?: string; details?: [string, string][] }[] = [
    { label: weekly.cycle.firstPeriod, value: money(Number(offer.first.total)), details: periodLines(offer.first, offer) },
    { label: 'Deposit', value: depositSummary(deposit, weeklyDepositTiming(offer.deposit_method)) },
    { label: 'Due today', value: money(Number(offer.first.total) + deposit) },
    {
      label: weekly.cycle.renews(offer.renew_weekday_name),
      value: money(Number(offer.recurring.total)),
      note: weekly.cycle.recurringNote,
    },
  ];

  return (
    <div aria-busy={weekly.stale} className={cn('flex flex-col gap-[10px]', weekly.stale && 'opacity-50 transition-opacity')}>
      {rows.map(({ label, value, note, details }) => (
        <div key={label} className="flex flex-col gap-[6px]">
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <div className={cn('font-medium', skin.strong)}><Dyn>{label}</Dyn></div>
              {note ? <div className={cn('mt-px text-[11.5px]', skin.quiet)}><Dyn>{note}</Dyn></div> : null}
            </div>
            <span className={cn('text-right font-medium', skin.strong)}><Dyn>{value}</Dyn></span>
          </div>
          {details?.map(([line, amount]) => (
            <div key={line} className={cn('flex justify-between gap-3 pl-3 text-[12px]', skin.quiet)}>
              <Dyn>{line}</Dyn>
              <span>{amount}</span>
            </div>
          ))}
        </div>
      ))}
      {terms.length > 0 ? <p className={cn('text-[12px]', skin.quiet)}><Dyn>{terms.join(' · ')}</Dyn></p> : null}
      <p className={cn('text-[12px]', skin.quiet)}><Dyn>{insurance}</Dyn></p>
      <label className={cn('mt-1 flex cursor-pointer items-start gap-2.5 rounded-[10px] border px-3 py-2.5', skin.line)}>
        <input
          type="checkbox"
          checked={weekly.consent}
          onChange={(e) => weekly.setConsent(e.target.checked)}
          className={cn('mt-[2px] h-[14px] w-[14px] flex-shrink-0', skin.accent)}
        />
        <span className={cn('text-[12px] leading-[1.5]', skin.strong)}>
          <Dyn>{offer.consent_text}</Dyn>
          <span className="ml-0.5 text-danger">*</span>
        </span>
      </label>
    </div>
  );
}
