'use client';

import { Dyn } from '@/components/i18n/Dyn';
import { cn, money } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import { depositSummary, weeklyDepositTiming } from '@/lib/price-rows';
import type { OngoingOffer, RentalModel } from '@/services/rentalServices';

export interface WeeklyState {
  options: Exclude<RentalModel, 'daily'>[];
  model: Exclude<RentalModel, 'daily'> | null;
  on: boolean;
  canPickDate: boolean;
  set: (next: boolean) => void;
  offer: OngoingOffer | null;
  reason: string | null;
  stale: boolean;
  consent: boolean;
  setConsent: (next: boolean) => void;
}

const MODE_LABEL: Record<Exclude<RentalModel, 'daily'>, string> = {
  gig: 'Weekly rental · no fixed return',
  subscription: 'Subscription · no fixed return',
};

const OWN_POLICY = 'Your own insurance policy is required for weekly rentals';

const INSURANCE_NOTE: Record<string, string> = {
  own_rideshare_required: 'Your own rideshare insurance policy is required for weekly rentals',
  included_in_plan: 'Insurance is included in the weekly price',
};

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
  if (!weekly.model || !weekly.canPickDate) return null;
  const options: [boolean, string][] = [
    [false, 'Pick a date'],
    [true, MODE_LABEL[weekly.model]],
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
  const rows: [string, string, string?][] = [
    ['Due today · week 1', money(Number(offer.first.total))],
    [`Then every ${offer.renew_weekday_name}`, money(Number(offer.recurring.total)), 'until you return the car'],
    ['Deposit', depositSummary(Number(offer.deposit), weeklyDepositTiming(offer.deposit_method))],
  ];

  return (
    <div aria-busy={weekly.stale} className={cn('flex flex-col gap-[10px]', weekly.stale && 'opacity-50 transition-opacity')}>
      {rows.map(([label, value, note]) => (
        <div key={label} className="flex items-start justify-between gap-3 text-[13px]">
          <div>
            <div className={cn('font-medium', skin.strong)}><Dyn>{label}</Dyn></div>
            {note ? <div className={cn('mt-px text-[11.5px]', skin.quiet)}><Dyn>{note}</Dyn></div> : null}
          </div>
          <span className={cn('text-right font-medium', skin.strong)}><Dyn>{value}</Dyn></span>
        </div>
      ))}
      {terms.length > 0 ? <p className={cn('text-[12px]', skin.quiet)}><Dyn>{terms.join(' · ')}</Dyn></p> : null}
      <p className={cn('text-[12px]', skin.quiet)}><Dyn>{insurance}</Dyn></p>
      {offer.required_documents.length > 0 ? (
        <p className={cn('text-[12px]', skin.quiet)}>
          <Dyn>{`After booking we'll ask you to upload ${offer.required_documents.join(' and ')}.`}</Dyn>
        </p>
      ) : null}
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
