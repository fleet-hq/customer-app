'use client';

import type { ReactNode } from 'react';

import { Check, Info } from '@/components/ui/icons';

import type { InsuranceOption, ManualInsurancePackage } from '@/services/bookingServices';
import type { AbiQuoteAvailable } from '@/services/abiServices';
import { cn, money } from '@/lib/utils';

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
  const hasAbi = !!abiQuote && !!onToggleAbi;
  if (bonzahPlans.length === 0 && manualPackages.length === 0 && !hasAbi) return null;

  return (
    <>
      <h3 ref={headingRef} className="mb-3 text-[15px] font-semibold text-ink">
        Protection
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
      {bonzahPlans.length > 0 && <BonzahDisclosure />}
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
  const linkClass = 'font-medium text-primary underline';
  return (
    <div className="mb-[26px] rounded-[10px] border border-line bg-subtle px-4 py-[14px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
        Insurance disclosure
      </p>
      <div className="mt-2 flex flex-col gap-2 text-[11.5px] leading-[1.6] text-muted">
        <p>
          By purchasing coverage through this site, you acknowledge that Pablow Inc. dba
          Bonzah.com (&ldquo;Bonzah&rdquo;) is the licensed broker of record and offers
          insurance coverage through various insurance carriers. The specific carrier issuing
          your policy will be identified at the time of purchase and in your policy documents.
        </p>
        <p>
          Coverage excludes medical payments (MedPay), Personal Injury Protection (PIP),
          Underinsured Motorist (UIM), and Uninsured Motorist (UM) coverage where permitted by
          law. Full terms, conditions, limits, and exclusions are set forth in the policy
          documents provided at the time of purchase.
        </p>
        <p>
          Insurance is only for drivers 21 years and older with a valid driver&apos;s license and
          must be listed as an additional driver on the rental agreement. Unlicensed drivers are
          not entitled to coverage under any circumstance. The renter is responsible for any
          unlisted drivers. Insurance may not apply if the renter or additional driver violates
          the rental agreement, insurance agreement, or violates traffic regulations.
        </p>
        <p>
          By proceeding with your purchase, you agree to Bonzah.com&apos;s{' '}
          <a href={BONZAH_LINKS.terms} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href={BONZAH_LINKS.privacy} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Privacy Policy
          </a>
          .
        </p>
        <p>
          See also Bonzah&apos;s{' '}
          <a href={BONZAH_LINKS.vehicles} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Covered Vehicles
          </a>{' '}
          and{' '}
          <a href={BONZAH_LINKS.faq} target="_blank" rel="noopener noreferrer" className={linkClass}>
            FAQs
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
  const daily = Number(quote.daily_price);
  return (
    <div
      onClick={onToggle}
      className={cn(
        'relative flex flex-col rounded-[12px] p-[14px] transition-colors',
        selected
          ? 'cursor-pointer border-[1.5px] border-primary bg-primary-soft'
          : 'cursor-pointer border border-line bg-white',
      )}
    >
      <div className="flex items-center gap-[9px]">
        <span
          className={cn(
            'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
            selected ? 'border-primary bg-primary' : 'border-control bg-white',
          )}
        >
          {selected && <Check size={12} strokeWidth={3} className="text-white" />}
        </span>
        <span className="text-[13.5px] font-semibold text-ink">Rental Coverage</span>
      </div>
      <div className="mt-[9px] text-[12px] leading-[1.5] text-muted">
        Liability{quote.comp_coll_included ? ' + Comprehensive & Collision' : ''} for the trip.
      </div>
      <div className={cn('mt-auto pt-3 text-[16px] font-bold', selected ? 'text-primary' : 'text-ink')}>
        {money(daily)}
        <span className="text-[11px] font-normal text-muted">/day</span>
      </div>
      {quote.comp_coll_included && (
        <div className={cn('mt-3 border-t pt-[10px]', selected ? 'border-primary-border' : 'border-hairline')}>
          <span className="inline-flex items-center rounded bg-green-bg border border-green-border px-[7px] py-[3px] text-[10px] font-semibold text-success">
            Comp/Coll included
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
  const disabled = pkg.isMandatory;
  const showAsSelected = selected || disabled;
  const label = pkg.customTypeLabel || pkg.coverageType;
  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={cn(
        'relative grid grid-rows-[auto_auto_1fr_auto] gap-y-[9px] rounded-[12px] p-[14px] transition-colors',
        disabled
          ? 'cursor-not-allowed border-[1.5px] border-primary bg-primary-soft opacity-90'
          : selected
            ? 'cursor-pointer border-[1.5px] border-primary bg-primary-soft'
            : 'cursor-pointer border border-line bg-white',
      )}
    >
      {pkg.isMandatory && (
        <span className="absolute right-3 top-3 rounded-[5px] bg-primary px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[0.03em] text-white">
          Required
        </span>
      )}
      <div className="flex items-center gap-[9px]">
        <span
          className={cn(
            'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
            showAsSelected ? 'border-primary bg-primary' : 'border-control bg-white',
          )}
        >
          {showAsSelected && <Check size={12} strokeWidth={3} className="text-white" />}
        </span>
        <span className="text-[13.5px] font-semibold text-ink">{pkg.title}</span>
      </div>
      <div className="text-[10.5px] uppercase tracking-[0.04em] text-muted">{label}</div>
      <div className="text-[12px] leading-[1.5] text-muted whitespace-pre-line">
        {pkg.description}
      </div>
      <div className={cn('text-[16px] font-bold', showAsSelected ? 'text-primary' : 'text-ink')}>
        {money(pkg.dailyRate)}
        <span className="text-[11px] font-normal text-muted">/day</span>
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
  return (
    <div
      onClick={() => {
        if (disabled) return;
        if (hasDetail) onOpenDetail();
        else onSelect();
      }}
      className={cn(
        'relative flex flex-col rounded-[12px] p-[14px] transition-colors',
        disabled
          ? 'cursor-not-allowed border border-line bg-subtle opacity-70'
          : selected
            ? 'cursor-pointer border-[1.5px] border-primary bg-primary-soft'
            : 'cursor-pointer border border-line bg-white',
      )}
    >
      {recommended && !disabled && (
        <span className="absolute right-3 top-3 rounded-[5px] bg-primary px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[0.03em] text-white">
          Recommended
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
            selected ? 'border-primary bg-primary' : 'border-control bg-white',
          )}
        >
          {selected && <Check size={12} strokeWidth={3} className="text-white" />}
        </span>
        <span className="text-[13.5px] font-semibold text-ink">{plan.title}</span>
      </div>
      <div className="mt-[9px] text-[12px] leading-[1.5] text-muted">{plan.description}</div>
      <div className={cn('mt-auto pt-3 text-[16px] font-bold', selected ? 'text-primary' : 'text-ink')}>
        {plan.price === 0 ? '$0.00' : money(plan.price)}
        <span className="text-[11px] font-normal text-muted">{plan.price === 0 ? '' : '/day'}</span>
      </div>
      {disabled ? (
        <div className="mt-3 border-t border-hairline pt-[10px]">
          <span className="inline-flex items-center rounded bg-amber-bg border border-amber-border px-[7px] py-[3px] text-[10px] font-semibold text-amber-text-2">
            Requires RCLI
          </span>
        </div>
      ) : hasDetail ? (
        <div className={cn('mt-3 border-t pt-[10px]', selected ? 'border-primary-border' : 'border-hairline')}>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="inline-flex cursor-pointer items-center gap-[5px] text-[11.5px] font-semibold text-primary"
          >
            <Info size={13} strokeWidth={2} />
            See what&apos;s covered
          </span>
        </div>
      ) : null}
    </div>
  );
}
