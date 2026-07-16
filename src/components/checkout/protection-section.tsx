'use client';

import type { ReactNode } from 'react';

import { Check, Info } from '@/components/ui/icons';

import type { InsuranceOption, ManualInsurancePackage } from '@/services/bookingServices';
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
}: Props): ReactNode {
  if (bonzahPlans.length === 0 && manualPackages.length === 0) return null;

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
        {manualPackages.map((pkg) => (
          <ManualCard
            key={pkg.id}
            pkg={pkg}
            selected={selectedManualIds.has(pkg.id)}
            onToggle={() => onToggleManual(pkg.id)}
          />
        ))}
      </div>
    </>
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
