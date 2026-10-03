'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Close, MapPin, ShieldCheck } from '@/components/ui/icons';
import { Dialog } from '@/components/ui/dialog';
import type { InsuranceOption } from '@/services/bookingServices';
import { cn, money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { useTenant } from '@/lib/tenant-context';

// Presentational pieces shared verbatim by both templates' fleet
// detail pages — reused as-is inside a template-2-tokened container
// rather than re-implemented, per the Phase-1 trade-off documented in
// the extraction commit (form/selection primitives keep their
// Tailwind styling; only the page chrome around them differs).

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTripStamp(dateIso: string, time: string): string {
  const d = new Date(dateIso + 'T00:00:00');
  const month = isNaN(d.getTime()) ? '' : MONTHS[d.getMonth()];
  const day = isNaN(d.getTime()) ? dateIso : d.getDate();
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${month} ${day}, ${h12}:${m} ${period}`;
}

export const SPEC_ICONS: Record<string, React.ReactNode> = {
  seats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
  transmission: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M6 8v8M18 8v3a3 3 0 0 1-3 3H8" />
    </svg>
  ),
  fuel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12" />
      <path d="M13 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3" />
    </svg>
  ),
  year: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  mileage: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13l3-3M12 5V3M5 5l1 1M19 5l-1 1" />
    </svg>
  ),
};

export const EXTRA_ICON = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
  </svg>
);

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object' || !('response' in error)) return fallback;
  const body = (error as { response?: { data?: unknown } }).response?.data;
  if (!body || typeof body !== 'object') return fallback;
  const nested = (body as { errors?: unknown }).errors;
  const source = (nested && typeof nested === 'object' ? nested : body) as Record<string, unknown>;
  const messages = Object.values(source)
    .flat()
    .filter((v): v is string => typeof v === 'string');
  return messages.length > 0 ? messages.join(' ') : fallback;
}

export function LocationDropdown({
  open,
  onToggle,
  onClose,
  options,
  value,
  placeholder,
  onSelect,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  options: { id: string; name: string; address: string; price: number }[];
  value: string | null;
  placeholder: string;
  onSelect: (id: string) => void;
}) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const selected = options.find((l) => String(l.id) === value);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex h-[46px] w-full items-center gap-2 rounded-[10px] border border-line bg-white px-[14px] text-left text-sm text-ink transition-colors focus:border-primary focus:outline-none',
          isT2 &&
            'rounded-[2px] border-[var(--line-strong)] bg-[var(--card)] text-[var(--text)] focus:border-[var(--brass)]',
        )}
      >
        <MapPin size={16} className={cn('flex-shrink-0', isT2 ? 'text-[var(--brass)]' : 'text-primary')} />
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            selected.name
          ) : (
            <span className={cn('text-placeholder', isT2 && 'text-[var(--text-muted)]')}><Dyn>{placeholder}</Dyn></span>
          )}
        </span>
        {selected && selected.price > 0 && (
          <span
            className={cn(
              'flex-shrink-0 rounded-[5px] bg-primary-soft px-[7px] py-[2px] text-[11px] font-semibold text-primary',
              isT2 && 'bg-[color-mix(in_srgb,var(--brass)_14%,var(--card))] text-[var(--brass)]',
            )}
          >
            +{money(selected.price)}
          </span>
        )}
        <ChevronDown size={13} className={cn('flex-shrink-0 text-faint', isT2 && 'text-[var(--text-muted)]')} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full z-40 mt-[6px] max-h-[260px] overflow-y-auto rounded-[11px] border border-line bg-white p-[6px] shadow-[var(--shadow-pop)]',
            isT2 && 'rounded-[3px] border-[var(--line-strong)] bg-[var(--card)] shadow-[var(--shadow)]',
          )}
        >
          {options.length === 0 ? (
            <div className={cn('px-[11px] py-[10px] text-[13px] text-faint', isT2 && 'text-[var(--text-muted)]')}>
              <Dyn>No locations available</Dyn>
            </div>
          ) : (
            options.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelect(String(loc.id))}
                className={cn(
                  'flex w-full items-start gap-[9px] rounded-lg px-[11px] py-[10px] text-left text-[13.5px] text-label hover:bg-primary-soft hover:text-secondary',
                  isT2 &&
                    'rounded-[2px] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--brass)_14%,var(--card))] hover:text-[var(--text)]',
                )}
              >
                <MapPin size={15} className={cn('mt-px flex-shrink-0', isT2 ? 'text-[var(--brass)]' : 'text-primary')} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{loc.name}</span>
                  {loc.address && (
                    <span className={cn('block truncate text-[11.5px] text-faint', isT2 && 'text-[var(--text-muted)]')}>
                      {loc.address}
                    </span>
                  )}
                </span>
                {loc.price > 0 && (
                  <span
                    className={cn(
                      'flex-shrink-0 rounded-[5px] bg-primary-soft px-[7px] py-[2px] text-[11px] font-semibold text-primary',
                      isT2 && 'bg-[color-mix(in_srgb,var(--brass)_14%,var(--card))] text-[var(--brass)]',
                    )}
                  >
                    +{money(loc.price)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface InsuranceDetailContent {
  fullTitle: string;
  description: string;
  whyBuyTitle: string;
  whyBuyPoints: string[];
  coverageTitle: string;
  coverageFeatures: string[];
  brochureUrl: string;
}

export const INSURANCE_DETAILS: Record<string, InsuranceDetailContent> = {
  cdw: {
    fullTitle: 'Collision Damage Warranty (CDW)',
    description: 'Covers physical damages to the rental vehicle when there is an accident with another vehicle.',
    whyBuyTitle: 'Why buy primary damage?',
    whyBuyPoints: [
      'If you have an auto policy, though prefer not to risk a premium increase in case you damage the rental car. Or..',
      "If you don't have an auto and/or normally use a credit card that only provides secondary damage insurance. Or..",
      'If you normally drive a commercial vehicle, which has insurance that does not cover you for damage to the rental car.',
    ],
    coverageTitle: 'Affordable Rental Vehicle Damage Insurance',
    coverageFeatures: [
      'Up to $35,000 Damage',
      '$1,000 Deductible',
      'Primary Insurance for accidents between vehicles',
      'Does not cover non-rental vehicle damage',
      'Excludes comprehensive coverage, such as mechanical issues caused by misuse, theft, vandalism, single car accident',
      'Not for commercial use. Not compatible with cars for hire and delivery services such as Uber, Lyft, DoorDash.',
    ],
    brochureUrl: '/bonzah/bonzah-cdw-brochure.pdf',
  },
  rcli: {
    fullTitle: "Renter's Contingent Liability Insurance (RCLI)",
    description: "Covers damage to 3rd parties' property and injury when renter is at fault in accident. Does not cover rental vehicle.",
    whyBuyTitle: 'Why buy primary liability?',
    whyBuyPoints: [
      'If you have an auto policy, though prefer not to risk a premium increase in case of a liability claim up to the state minimum requirement. Or..',
      "If you don't have an auto policy and don't want to be financially responsible for injuries to persons and property up to the state minimum requirement. Or..",
      'If you normally drive a commercial vehicle, which has insurance that does not cover you for liability to other persons or property while driving a rented vehicle.',
    ],
    coverageTitle: 'Primary State Minimum Liability Insurance',
    coverageFeatures: [
      'Bodily Injury - Per Person',
      'Bodily Injury - Aggregate',
      'Property Damage',
    ],
    brochureUrl: '/bonzah/bonzah-rcli-brochure.pdf',
  },
  sli: {
    fullTitle: 'Supplemental Liability Insurance (SLI)',
    description: 'Supplements RCLI coverage to enhanced levels of coverage. Not a standalone or primary policy, must be purchased with RCLI.',
    whyBuyTitle: 'Why buy supplemental liability?',
    whyBuyPoints: [
      'If you have an auto policy with low liability coverage, and want to increase it up to an aggregate of $500,000. Or..',
      'If you have selected the above primary liability insurance (RCLI), and want to increase your coverage beyond the state minimum for injuries to persons and property up to an aggregate of $500,000.',
    ],
    coverageTitle: 'Coverage is in Excess of Any Primary Liability Coverage',
    coverageFeatures: [
      'Bodily Injury - Per Person - Up to $100,000 in total',
      'Bodily Injury - Aggregate - Up to $500,000 in total',
      'Property Damage - $10,000 additional coverage',
    ],
    brochureUrl: '/bonzah/bonzah-sli-brochure.pdf',
  },
  pai: {
    fullTitle: 'Personal Accident / Personal Effects Insurance',
    description: 'Covers life, medical expenses, and lost or damaged items. Not rental vehicle coverage.',
    whyBuyTitle: 'Why buy personal accident & effects coverage?',
    whyBuyPoints: [
      'If there is an accidental death or accidental medical expense, these insurances protect the specified losses.',
      'If you do not have death protection this coverage protects the primary Renter or Sharer and their immediate family for a death while traveling.',
      'Personal Effects Coverage protects Your personal belongings as the primary Renter or Sharer and those of Your immediate family traveling with You.',
    ],
    coverageTitle: 'Accident, Medical & Personal Effects Insurance',
    coverageFeatures: [
      'Renter Loss of Life - $50,000',
      'Passenger Loss of Life - $5,000',
      'Accidental Medical Expense - $1,000',
      'Personal Effects Coverage - $500 with up to $25 deductible will be applied',
    ],
    brochureUrl: '/bonzah/bonzah-pai-brochure.pdf',
  },
};

export function InsuranceDetailModal({
  option,
  selected,
  disabled,
  onToggle,
  onClose,
}: {
  option: InsuranceOption | null;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const [whyBuyOpen, setWhyBuyOpen] = useState(false);
  const { t } = useDynamicTranslation(['Close']);
  if (!option) return null;
  const detail = INSURANCE_DETAILS[option.id];
  if (!detail) return null;
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      labelledBy="insurance-detail-title"
      className="items-end sm:items-center"
      panelClassName={cn(
        'max-h-[90vh] max-w-[560px] overflow-y-auto rounded-t-2xl sm:rounded-2xl',
        isT2 && 'bg-[var(--card)] text-[var(--text)]',
      )}
    >
        <div
          className={cn(
            'sticky top-0 z-10 border-b border-hairline bg-white px-[26px] pb-4 pt-[22px]',
            isT2 && 'border-[var(--line)] bg-[var(--card)]',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-[10px]">
              <span
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft',
                  isT2 && 'bg-[color-mix(in_srgb,var(--brass)_14%,var(--card))]',
                )}
              >
                <ShieldCheck size={15} className="text-primary" />
              </span>
              <h3
                id="insurance-detail-title"
                className={cn('text-[17px] font-semibold leading-tight text-secondary', isT2 && 'text-[var(--text)]')}
              >
                <Dyn>{detail.fullTitle}</Dyn>
              </h3>
            </div>
            <button
              type="button"
              aria-label={t('Close')}
              onClick={onClose}
              className={cn('flex-shrink-0 text-muted', isT2 && 'text-[var(--text-muted)]')}
            >
              <Close size={20} strokeWidth={2} />
            </button>
          </div>
          <div className="mt-[10px] flex items-baseline gap-1">
            <span className="text-[24px] font-bold text-primary">{money(option.price)}</span>
            <span className={cn('text-[13px] text-muted', isT2 && 'text-[var(--text-muted)]')}><Dyn>/ 24 hours</Dyn></span>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-[26px] py-5">
          <p className={cn('text-[13.5px] leading-[1.6] text-muted', isT2 && 'text-[var(--text-muted)]')}><Dyn>{detail.description}</Dyn></p>

          <div className={cn('overflow-hidden rounded-[10px] border border-line', isT2 && 'rounded-[3px] border-[var(--line-strong)]')}>
            <button
              type="button"
              onClick={() => setWhyBuyOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[13.5px] font-semibold text-primary"><Dyn>{detail.whyBuyTitle}</Dyn></span>
              <ChevronDown size={16} className={cn('text-primary transition-transform', whyBuyOpen && 'rotate-180')} />
            </button>
            {whyBuyOpen && (
              <div className={cn('border-t border-hairline px-4 pb-4', isT2 && 'border-[var(--line)]')}>
                <ul className="mt-3 flex flex-col gap-3">
                  {detail.whyBuyPoints.map((point, i) => (
                    <li key={i} className={cn('flex gap-2 text-[13px] leading-[1.55] text-muted', isT2 && 'text-[var(--text-muted)]')}>
                      <span className={cn('mt-[7px] h-[5px] w-[5px] flex-shrink-0 rounded-full bg-faint', isT2 && 'bg-[var(--text-muted)]')} />
                      <span><Dyn>{point}</Dyn></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h4 className={cn('mb-3 text-[13.5px] font-semibold text-ink', isT2 && 'text-[var(--text)]')}><Dyn>{detail.coverageTitle}</Dyn></h4>
            <ul className="flex flex-col gap-[10px]">
              {detail.coverageFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-[10px]">
                  <span
                    className={cn(
                      'mt-px inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-bg-2',
                      isT2 && 'bg-[color-mix(in_srgb,var(--success)_16%,var(--card))]',
                    )}
                  >
                    <Check size={12} strokeWidth={3} className={cn('text-success', isT2 && 'text-[var(--success)]')} />
                  </span>
                  <span className={cn('text-[13px] leading-[1.5] text-label', isT2 && 'text-[var(--text)]')}><Dyn>{feature}</Dyn></span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={detail.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-primary"
          >
            <Dyn>Description of Coverage</Dyn>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6M10 14 21 3" />
            </svg>
          </a>
        </div>

        <div
          className={cn(
            'sticky bottom-0 border-t border-hairline bg-white px-[26px] py-4',
            isT2 && 'border-[var(--line)] bg-[var(--card)]',
          )}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onClose();
            }}
            className={cn(
              'w-full rounded-[10px] py-3 text-sm font-semibold transition-colors',
              isT2 && 'rounded-[2px]',
              disabled
                ? isT2
                  ? 'cursor-not-allowed bg-[var(--line)] text-[var(--text-muted)]'
                  : 'cursor-not-allowed bg-subtle text-faint'
                : selected
                  ? isT2
                    ? 'border border-[var(--line-strong)] bg-[var(--card)] text-[var(--text)] hover:border-[var(--brass)] hover:text-[var(--brass)]'
                    : 'bg-subtle text-ink hover:bg-chip'
                  : isT2
                    ? 'bg-[var(--brass)] text-[var(--on-brass)] hover:bg-[var(--brass-bright)]'
                    : 'bg-primary text-white hover:bg-primary-hover',
            )}
          >
            <Dyn>{disabled ? 'Requires RCLI' : selected ? 'Remove Coverage' : 'Add Coverage'}</Dyn>
          </button>
        </div>
    </Dialog>
  );
}
