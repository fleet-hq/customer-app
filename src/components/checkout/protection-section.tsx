'use client';

import type { ReactNode } from 'react';

import { Check, Info } from '@/components/ui/icons';
import { Dyn } from '@/components/i18n/Dyn';

import type { InsuranceOption, ManualInsurancePackage } from '@/services/bookingServices';
import type { AbiQuoteAvailable } from '@/services/abiServices';
import { cn, money } from '@/lib/utils';
import { useTenant } from '@/lib/tenant-context';

const T2_MONO = 'font-[family-name:var(--t2-font-mono)]';
const T2_CARD_BASE =
  'rounded-[3px] border-[var(--line)] bg-[var(--card)] text-[var(--text)]';
const T2_CARD_SELECTED =
  'rounded-[3px] border-[var(--brass)] bg-[color-mix(in_srgb,var(--brass)_6%,var(--card))] text-[var(--text)]';
const T2_CARD_DISABLED =
  'rounded-[3px] border-[var(--line)] bg-[var(--paper)] text-[var(--text)]';
const T2_CHECKBOX_ON = 'border-[var(--brass)] bg-[var(--brass)]';
const T2_CHECKBOX_OFF = 'border-[var(--line-strong)] bg-[var(--card)]';
const T2_BADGE = `${T2_MONO} bg-[var(--brass)] text-[var(--on-brass)]`;

interface Props {
  headingRef?: React.Ref<HTMLHeadingElement>;
  bonzahPlans: InsuranceOption[];
  manualPackages: ManualInsurancePackage[];
  selectedBonzah: Set<string>;
  selectedManualIds: Set<number>;
  onToggleBonzah: (id: string) => void;
  onToggleManual: (id: number) => void;
  onOpenBonzahDetail: (id: string) => void;
  isBonzahDisabled: (id: string) => boolean;
  hasBonzahDetail: (id: string) => boolean;
  recommendedBonzahId?: string;
  abiQuote?: AbiQuoteAvailable | null;
  abiOpted?: boolean;
  onToggleAbi?: (opted: boolean) => void;
}

// Bonzah + manual (tenant-added) insurance packages render in a single
// flat grid — the customer doesn't care where a package originates
// from, only what it covers and what it costs. The old two-tab UI
// (Bonzah / Custom) surfaced an implementation detail. Bonzah plans
// come first because they carry the "Recommended" affordance; manual
// packages follow. Section is hidden entirely when neither source has
// any options.
export default function ProtectionSection({
  headingRef,
  bonzahPlans,
  manualPackages,
  selectedBonzah,
  selectedManualIds,
  onToggleBonzah,
  onToggleManual,
  onOpenBonzahDetail,
  isBonzahDisabled,
  hasBonzahDetail,
  recommendedBonzahId,
  abiQuote,
  abiOpted,
  onToggleAbi,
}: Props): ReactNode {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const hasAbi = !!abiQuote && !!onToggleAbi;
  if (bonzahPlans.length === 0 && manualPackages.length === 0 && !hasAbi) return null;

  return (
    <>
      <h3
        ref={headingRef}
        className={cn('mb-3 text-[15px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}
      >
        <Dyn>Protection</Dyn>
      </h3>
      <div className="mb-[26px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
        {bonzahPlans.map((p) => (
          <BonzahCard
            key={p.id}
            plan={p}
            selected={selectedBonzah.has(p.id)}
            disabled={isBonzahDisabled(p.id)}
            hasDetail={hasBonzahDetail(p.id)}
            recommended={recommendedBonzahId === p.id}
            onSelect={() => onToggleBonzah(p.id)}
            onOpenDetail={() => onOpenBonzahDetail(p.id)}
          />
        ))}
        {hasAbi && (
          <AbiCard
            quote={abiQuote!}
            selected={!!abiOpted}
            onToggle={() => onToggleAbi!(!abiOpted)}
          />
        )}
        {manualPackages.map((pkg) => (
          <ManualCard
            key={pkg.id}
            pkg={pkg}
            selected={selectedManualIds.has(pkg.id)}
            onToggle={() => onToggleManual(pkg.id)}
          />
        ))}
      </div>
      {bonzahPlans.some((p) => p.id !== 'own') && <BonzahDisclosure />}
    </>
  );
}

const BONZAH_LINKS = {
  terms: 'https://bonzah.com/terms',
  privacy: 'https://bonzah.com/privacy',
  vehicles: 'https://bonzah.com/included-and-restricted-vehicle-types',
  faq: 'https://bonzah.com/faq',
} as const;

function BonzahDisclosure() {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const linkClass = isT2
    ? 'font-medium text-[var(--brass)] underline'
    : 'font-medium text-primary underline';
  return (
    <div
      className={cn(
        'mb-[26px] rounded-[10px] border px-4 py-[14px]',
        isT2
          ? 'rounded-[3px] border-[var(--line-strong)] bg-[var(--card)]'
          : 'border-line bg-subtle',
      )}
    >
      <p
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.04em]',
          isT2 ? `${T2_MONO} text-[var(--text-muted)]` : 'text-muted',
        )}
      >
        <Dyn>Insurance disclosure</Dyn>
      </p>
      <div
        className={cn(
          'mt-2 flex flex-col gap-2 text-[11.5px] leading-[1.6]',
          isT2 ? 'text-[var(--text-muted)]' : 'text-muted',
        )}
      >
        <p>
          <Dyn>By purchasing coverage through this site, you acknowledge that Pablow Inc. dba Bonzah.com (&ldquo;Bonzah&rdquo;) is the licensed broker of record and offers insurance coverage through various insurance carriers. The specific carrier issuing your policy will be identified at the time of purchase and in your policy documents.</Dyn>
        </p>
        <p>
          <Dyn>Coverage excludes medical payments (MedPay), Personal Injury Protection (PIP), Underinsured Motorist (UIM), and Uninsured Motorist (UM) coverage where permitted by law. Full terms, conditions, limits, and exclusions are set forth in the policy documents provided at the time of purchase.</Dyn>
        </p>
        <p>
          <Dyn>Insurance is only for drivers 21 years and older with a valid driver&apos;s license and must be listed as an additional driver on the rental agreement. Unlicensed drivers are not entitled to coverage under any circumstance. The renter is responsible for any unlisted drivers. Insurance may not apply if the renter or additional driver violates the rental agreement, insurance agreement, or violates traffic regulations.</Dyn>
        </p>
        <p>
          By proceeding with your purchase, you agree to Bonzah.com&apos;s{' '}
          <a href={BONZAH_LINKS.terms} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Dyn>Terms of Service</Dyn>
          </a>{' '}
          and{' '}
          <a href={BONZAH_LINKS.privacy} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Dyn>Privacy Policy</Dyn>
          </a>
          .
        </p>
        <p>
          See also Bonzah&apos;s{' '}
          <a href={BONZAH_LINKS.vehicles} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Dyn>Covered Vehicles</Dyn>
          </a>{' '}
          and{' '}
          <a href={BONZAH_LINKS.faq} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Dyn>FAQs</Dyn>
          </a>
          .
        </p>
      </div>
    </div>
  );
}


function AbiCard({
  quote,
  selected,
  onToggle,
}: {
  quote: AbiQuoteAvailable;
  selected: boolean;
  onToggle: () => void;
}) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const daily = Number(quote.daily_price);
  return (
    <div
      onClick={onToggle}
      className={cn(
        'relative flex flex-col rounded-[12px] p-[14px] transition-colors',
        isT2
          ? cn('cursor-pointer border', selected ? T2_CARD_SELECTED : T2_CARD_BASE)
          : selected
            ? 'cursor-pointer border-[1.5px] border-primary bg-primary-soft'
            : 'cursor-pointer border border-line bg-white',
      )}
    >
      <div className="flex items-center gap-[9px]">
        <span
          className={cn(
            'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
            isT2
              ? selected ? T2_CHECKBOX_ON : T2_CHECKBOX_OFF
              : selected ? 'border-primary bg-primary' : 'border-control bg-white',
          )}
        >
          {selected && (
            <Check size={12} strokeWidth={3} className={isT2 ? 'text-[var(--on-brass)]' : 'text-white'} />
          )}
        </span>
        <span className={cn('text-[13.5px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
          <Dyn>Rental Coverage</Dyn>
        </span>
      </div>
      <div className={cn('mt-[9px] text-[12px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
        {quote.comp_coll_included ? (
          <Dyn>Liability + Comprehensive & Collision for the trip.</Dyn>
        ) : (
          <Dyn>Liability for the trip.</Dyn>
        )}
      </div>
      <div
        className={cn(
          'mt-auto pt-3 text-[16px] font-bold',
          isT2 ? (selected ? 'text-[var(--brass)]' : 'text-[var(--text)]') : selected ? 'text-primary' : 'text-ink',
        )}
      >
        {money(daily)}
        <span className={cn('text-[11px] font-normal', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
          <Dyn>/day</Dyn>
        </span>
      </div>
      {quote.comp_coll_included && (
        <div
          className={cn(
            'mt-3 border-t pt-[10px]',
            isT2 ? 'border-[var(--line)]' : selected ? 'border-primary-border' : 'border-hairline',
          )}
        >
          <span
            className={cn(
              'inline-flex items-center rounded px-[7px] py-[3px] text-[10px] font-semibold',
              isT2
                ? `${T2_MONO} border border-[color-mix(in_srgb,var(--success)_45%,var(--line))] bg-[color-mix(in_srgb,var(--success)_14%,var(--card))] text-[var(--success)]`
                : 'bg-green-bg border border-green-border text-success',
            )}
          >
            <Dyn>Comp/Coll included</Dyn>
          </span>
        </div>
      )}
    </div>
  );
}

function ManualCard({
  pkg,
  selected,
  onToggle,
}: {
  pkg: ManualInsurancePackage;
  selected: boolean;
  onToggle: () => void;
}) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const disabled = pkg.isMandatory;
  const showAsSelected = selected || disabled;
  const label = pkg.customTypeLabel || pkg.coverageType;
  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={cn(
        'relative grid grid-rows-[auto_auto_1fr_auto] gap-y-[9px] rounded-[12px] p-[14px] transition-colors',
        isT2
          ? cn(
              disabled ? 'cursor-not-allowed opacity-90 border' : 'cursor-pointer border',
              showAsSelected ? T2_CARD_SELECTED : T2_CARD_BASE,
            )
          : disabled
            ? 'cursor-not-allowed border-[1.5px] border-primary bg-primary-soft opacity-90'
            : selected
              ? 'cursor-pointer border-[1.5px] border-primary bg-primary-soft'
              : 'cursor-pointer border border-line bg-white',
      )}
    >
      {pkg.isMandatory && (
        <span
          className={cn(
            'absolute right-3 top-3 rounded-[5px] px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[0.03em]',
            isT2 ? T2_BADGE : 'bg-primary text-white',
          )}
        >
          <Dyn>Required</Dyn>
        </span>
      )}
      <div className="flex items-center gap-[9px]">
        <span
          className={cn(
            'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
            isT2
              ? showAsSelected ? T2_CHECKBOX_ON : T2_CHECKBOX_OFF
              : showAsSelected ? 'border-primary bg-primary' : 'border-control bg-white',
          )}
        >
          {showAsSelected && (
            <Check size={12} strokeWidth={3} className={isT2 ? 'text-[var(--on-brass)]' : 'text-white'} />
          )}
        </span>
        <span className={cn('text-[13.5px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
          <Dyn>{pkg.title}</Dyn>
        </span>
      </div>
      <div
        className={cn(
          'text-[10.5px] uppercase tracking-[0.04em]',
          isT2 ? `${T2_MONO} text-[var(--text-muted)]` : 'text-muted',
        )}
      >
        <Dyn>{label}</Dyn>
      </div>
      <div className={cn('text-[12px] leading-[1.5] whitespace-pre-line', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
        <Dyn>{pkg.description}</Dyn>
      </div>
      <div
        className={cn(
          'text-[16px] font-bold',
          isT2 ? (showAsSelected ? 'text-[var(--brass)]' : 'text-[var(--text)]') : showAsSelected ? 'text-primary' : 'text-ink',
        )}
      >
        {money(pkg.dailyRate)}
        <span className={cn('text-[11px] font-normal', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
          <Dyn>/day</Dyn>
        </span>
      </div>
    </div>
  );
}

function BonzahCard({
  plan,
  selected,
  disabled,
  hasDetail,
  recommended,
  onSelect,
  onOpenDetail,
}: {
  plan: InsuranceOption;
  selected: boolean;
  disabled: boolean;
  hasDetail: boolean;
  recommended: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
}) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  return (
    <div
      onClick={() => {
        if (disabled) return;
        if (hasDetail) onOpenDetail();
        else onSelect();
      }}
      className={cn(
        'relative flex flex-col rounded-[12px] p-[14px] transition-colors',
        isT2
          ? cn('border', disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer', disabled ? T2_CARD_DISABLED : selected ? T2_CARD_SELECTED : T2_CARD_BASE)
          : disabled
            ? 'cursor-not-allowed border border-line bg-subtle opacity-70'
            : selected
              ? 'cursor-pointer border-[1.5px] border-primary bg-primary-soft'
              : 'cursor-pointer border border-line bg-white',
      )}
    >
      {recommended && !disabled && (
        <span
          className={cn(
            'absolute right-3 top-3 rounded-[5px] px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[0.03em]',
            isT2 ? T2_BADGE : 'bg-primary text-white',
          )}
        >
          <Dyn>Recommended</Dyn>
        </span>
      )}
      <div className="flex items-center gap-[9px]">
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onSelect();
          }}
          className={cn(
            'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
            isT2
              ? selected ? T2_CHECKBOX_ON : T2_CHECKBOX_OFF
              : selected ? 'border-primary bg-primary' : 'border-control bg-white',
          )}
        >
          {selected && (
            <Check size={12} strokeWidth={3} className={isT2 ? 'text-[var(--on-brass)]' : 'text-white'} />
          )}
        </span>
        <span className={cn('text-[13.5px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
          <Dyn>{plan.title}</Dyn>
        </span>
      </div>
      <div className={cn('mt-[9px] text-[12px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
        <Dyn>{plan.description}</Dyn>
      </div>
      <div
        className={cn(
          'mt-auto pt-3 text-[16px] font-bold',
          isT2 ? (selected ? 'text-[var(--brass)]' : 'text-[var(--text)]') : selected ? 'text-primary' : 'text-ink',
        )}
      >
        {plan.price === 0 ? '$0.00' : money(plan.price)}
        <span className={cn('text-[11px] font-normal', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
          {plan.price === 0 ? '' : <Dyn>/day</Dyn>}
        </span>
      </div>
      {disabled ? (
        <div className={cn('mt-3 border-t pt-[10px]', isT2 ? 'border-[var(--line)]' : 'border-hairline')}>
          <span
            className={cn(
              'inline-flex items-center rounded px-[7px] py-[3px] text-[10px] font-semibold',
              isT2
                ? `${T2_MONO} border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--text-muted)]`
                : 'bg-amber-bg border border-amber-border text-amber-text-2',
            )}
          >
            <Dyn>Requires RCLI</Dyn>
          </span>
        </div>
      ) : hasDetail ? (
        <div
          className={cn(
            'mt-3 border-t pt-[10px]',
            isT2 ? 'border-[var(--line)]' : selected ? 'border-primary-border' : 'border-hairline',
          )}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className={cn(
              'inline-flex cursor-pointer items-center gap-[5px] text-[11.5px] font-semibold',
              isT2 ? 'text-[var(--brass)]' : 'text-primary',
            )}
          >
            <Info size={13} strokeWidth={2} />
            <Dyn>See what&apos;s covered</Dyn>
          </span>
        </div>
      ) : null}
    </div>
  );
}
