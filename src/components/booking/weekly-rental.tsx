'use client';

import { Dyn } from '@/components/i18n/Dyn';
import { cn } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import type { CycleWords } from '@/lib/billing-cycle';
import type { OngoingInvoice } from '@/lib/ongoing-invoice';
import type { BillingCycle, OngoingOffer, RentalModel } from '@/services/rentalServices';

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
  cycles: {
    value: string;
    label: string;
    description: string;
    perWeek: string;
    saving: string;
    best: boolean;
  }[];
  termsBlurb: string;
  cycleValue: string | null;
  setCycle: (next: BillingCycle) => void;
  invoice: OngoingInvoice | null;
}

function modeLabel(model: Exclude<RentalModel, 'daily'>, cycle: CycleWords): string {
  return `${model === 'subscription' ? 'Subscription' : cycle.rentalTitle} · no fixed return`;
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
      {weekly.on && weekly.cycles.length > 1 && (
        <div className="mt-1">
          <div className={cn('mb-[6px] text-[11px] tracking-[0.03em] uppercase', skin.quiet)}>
            <Dyn>Billing terms</Dyn>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {weekly.cycles.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => weekly.setCycle(option.value as BillingCycle)}
                className={cn(
                  'cursor-pointer rounded-[8px] border px-[11px] py-[6px] text-[12.5px]',
                  weekly.cycleValue === option.value ? skin.active : skin.line,
                  skin.strong,
                )}
              >
                <Dyn>{option.label}</Dyn>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyRentalSummary({ weekly, variant = 'tokens' }: { weekly: WeeklyState; variant?: Variant }) {
  const skin = useSkin(variant);
  const invoice = weekly.invoice;
  if (!invoice) {
    return (
      <p className={cn('text-[13px] leading-[1.5]', skin.quiet)}>
        <Dyn>{weekly.reason ?? 'Working out your weekly price…'}</Dyn>
      </p>
    );
  }
  const offer = weekly.offer;

  return (
    <div aria-busy={weekly.stale} className={cn('flex flex-col gap-3', weekly.stale && 'opacity-50 transition-opacity')}>
      {invoice.groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-[6px]">
          <div className={cn('text-[10px] font-semibold uppercase tracking-[0.14em]', skin.quiet)}>
            <Dyn>{group.heading}</Dyn>
          </div>
          {group.lines.map((line) => (
            <div key={line.key} className="flex items-start justify-between gap-3 text-[13px]">
              <div className={line.muted ? skin.quiet : skin.strong}>
                <Dyn>{line.label}</Dyn>
                {line.detail ? (
                  <div className={cn('mt-px text-[11.5px]', skin.quiet)}>
                    <Dyn>{line.detail}</Dyn>
                  </div>
                ) : null}
              </div>
              <span className={cn('text-right font-medium', line.muted ? skin.quiet : skin.strong)}>
                <Dyn>{line.amount}</Dyn>
              </span>
            </div>
          ))}
        </div>
      ))}

      <div className={cn('flex items-baseline justify-between gap-3 border-t pt-3', skin.line)}>
        <span className={cn('text-[11px] font-semibold uppercase tracking-[0.12em]', skin.quiet)}>
          <Dyn>{invoice.cycleLabel}</Dyn>
        </span>
        <span className={cn('text-[18px] font-bold', skin.strong)}>
          <span className={cn('mr-1 text-[11px] font-semibold', skin.quiet)}>USD</span>
          {invoice.cycleTotal}
        </span>
      </div>
      <p className={cn('text-[12px] leading-[1.5]', skin.quiet)}>
        <Dyn>{invoice.note}</Dyn>
      </p>

      {invoice.dueLines.map((line) => (
        <div
          key={line.key}
          className={cn(
            'flex items-start justify-between gap-3 text-[13px]',
            line.key === 'due' && cn('border-t pt-3 font-semibold', skin.line),
          )}
        >
          <div className={skin.strong}>
            <Dyn>{line.label}</Dyn>
            {line.detail ? (
              <div className={cn('mt-px text-[11.5px] font-normal', skin.quiet)}>
                <Dyn>{line.detail}</Dyn>
              </div>
            ) : null}
          </div>
          <span className={cn('text-right', skin.strong)}>
            <Dyn>{line.amount}</Dyn>
          </span>
        </div>
      ))}

      <div className={cn('border-t pt-3', skin.line)}>
        <div className={cn('mb-1 text-[10px] font-semibold uppercase tracking-[0.14em]', skin.quiet)}>
          <Dyn>{invoice.endingHeading}</Dyn>
        </div>
        <p className={cn('text-[12.5px] leading-[1.55]', skin.strong)}>
          <Dyn>{invoice.endingBody}</Dyn>
        </p>
      </div>

      {offer ? (
        <p className={cn('rounded-[10px] border px-3 py-2.5 text-[12px] leading-[1.5]', skin.line, skin.strong)}>
          <Dyn>{offer.consent_text}</Dyn>
        </p>
      ) : null}
    </div>
  );
}
