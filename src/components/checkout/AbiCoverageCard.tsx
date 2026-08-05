'use client';

import type { ReactNode } from 'react';
import { ShieldCheck, Check } from '@/components/ui/icons';
import { cn, money } from '@/lib/utils';
import type { AbiQuoteAvailable } from '@/services/abiServices';

interface Props {
  quote: AbiQuoteAvailable;
  opted: boolean;
  onChange: (opted: boolean) => void;
}

export default function AbiCoverageCard({ quote, opted, onChange }: Props): ReactNode {
  const daily = Number(quote.daily_price);
  const total = Number(quote.total_price);
  return (
    <div className="mb-[26px]">
      <h3 className="mb-3 text-[15px] font-semibold text-ink">Rental Coverage</h3>
      <div
        className={cn(
          'rounded-[12px] p-[16px] transition-colors',
          opted ? 'border-[1.5px] border-primary bg-primary-soft' : 'border border-line bg-white',
        )}
      >
        <div className="flex items-start gap-[12px]">
          <span
            className={cn(
              'flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px]',
              opted ? 'bg-white' : 'bg-primary-soft',
            )}
          >
            <ShieldCheck size={18} className="text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-semibold text-ink">Rental Coverage</span>
              {quote.comp_coll_included && (
                <span className="inline-flex items-center gap-[4px] rounded-full bg-green-bg-2 px-[8px] py-[2px] text-[10.5px] font-semibold text-success">
                  <Check size={11} strokeWidth={3} />
                  Comp/Coll included
                </span>
              )}
            </div>
            <div className="mt-[6px] text-[12.5px] leading-[1.5] text-muted">
              Full liability + comprehensive &amp; collision protection for the duration of your trip. Provided by ABI Insurance.
            </div>
            <div className="mt-[10px] flex items-baseline gap-[6px] text-[13px]">
              <span className="font-semibold text-ink">{money(daily)}/day</span>
              <span className="text-muted">×</span>
              <span className="text-muted">
                {quote.days} {quote.days === 1 ? 'day' : 'days'}
              </span>
              <span className="text-muted">=</span>
              <span className={cn('font-bold', opted ? 'text-primary' : 'text-ink')}>{money(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-[14px] grid grid-cols-2 gap-[8px]">
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              'flex items-center justify-center gap-[7px] rounded-[9px] border py-[10px] text-[12.5px] font-semibold transition-colors',
              !opted
                ? 'border-primary bg-white text-primary'
                : 'border-line bg-white text-muted hover:text-ink',
            )}
          >
            <span
              className={cn(
                'inline-flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px]',
                !opted ? 'border-primary' : 'border-control',
              )}
            >
              {!opted && <span className="h-[7px] w-[7px] rounded-full bg-primary" />}
            </span>
            Skip coverage
          </button>
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              'flex items-center justify-center gap-[7px] rounded-[9px] border py-[10px] text-[12.5px] font-semibold transition-colors',
              opted
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-ink hover:border-primary hover:text-primary',
            )}
          >
            <span
              className={cn(
                'inline-flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px]',
                opted ? 'border-white' : 'border-control',
              )}
            >
              {opted && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
            </span>
            Add coverage
          </button>
        </div>
      </div>
    </div>
  );
}
