'use client';

import { Dyn } from '@/components/i18n/Dyn';
import { cn } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import type { RentalTab } from '@/lib/rental-tabs';
import type { RentalModel } from '@/services/rentalServices';

interface ModelSplitProps {
  tabs: RentalTab[];
  active: RentalModel;
  onPick: (model: RentalModel) => void;
}

export function ModelSplit({ tabs, active, onPick }: ModelSplitProps) {
  const isT2 = useIsT2();
  if (tabs.length < 2) return null;

  return (
    <div
      role="tablist"
      className={cn(
        'grid overflow-hidden rounded-t-[12px] border border-b-0',
        isT2 ? 'border-[var(--line-strong)] bg-[var(--card)]' : 'border-line bg-white',
      )}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const on = tab.model === active;
        return (
          <button
            key={tab.model}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onPick(tab.model)}
            className={cn(
              'cursor-pointer border-t-[3px] px-[18px] py-[12px] text-left transition-colors',
              on
                ? isT2
                  ? 'border-t-[var(--brass)] bg-[var(--card)]'
                  : 'border-t-primary bg-white'
                : isT2
                  ? 'border-t-transparent bg-[color-mix(in_srgb,var(--card)_60%,transparent)]'
                  : 'border-t-transparent bg-subtle',
            )}
          >
            <span
              className={cn(
                'block text-[12.5px] font-semibold tracking-[0.04em] uppercase',
                on ? (isT2 ? 'text-[var(--brass)]' : 'text-primary') : isT2 ? 'text-[var(--text-muted)]' : 'text-faint',
              )}
            >
              <Dyn>{tab.label}</Dyn>
            </span>
            <span className={cn('mt-[3px] block text-[12px]', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
              <Dyn>{tab.blurb}</Dyn>
            </span>
          </button>
        );
      })}
    </div>
  );
}
