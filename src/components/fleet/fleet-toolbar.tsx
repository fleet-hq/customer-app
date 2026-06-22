'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Close, Check } from '@/components/ui/icons';
import { useClickOutside } from '@/lib/use-click-outside';
import { cn } from '@/lib/utils';
import { FleetFilters, type FilterState, type FilterOptions } from '@/components/fleet/fleet-filters';

interface FleetToolbarProps {
  heading: string;
  isFiltered: boolean;
  activeLabel: string;
  clearHref: string;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  sort: string;
  sorts: readonly string[];
  onSort: (value: string) => void;
  filters: FilterState;
  filterOptions: FilterOptions;
  onFilters: (filters: FilterState) => void;
  activeFilterCount: number;
}

export function FleetToolbar({
  heading,
  isFiltered,
  activeLabel,
  clearHref,
  search,
  onSearch,
  searchPlaceholder,
  sort,
  sorts,
  onSort,
  filters,
  filterOptions,
  onFilters,
  activeFilterCount,
}: FleetToolbarProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useClickOutside(panelRef, () => setOpen(false), open);

  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
      <div className="flex flex-col gap-3">
        <h1 className="text-[23px] font-semibold tracking-[-0.01em] text-ink">{heading}</h1>
        {isFiltered && (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary-border bg-primary-soft py-[6px] pr-2 pl-[14px]">
            <span className="text-[13px] font-medium text-secondary">
              Filtered by <span className="font-semibold text-primary">{activeLabel}</span>
            </span>
            <Link
              href={clearHref}
              aria-label="Clear filter"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
            >
              <Close size={11} strokeWidth={3} />
            </Link>
          </div>
        )}
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <div className="flex flex-1 items-center gap-[10px] rounded-[9px] border border-line bg-white px-4 py-[11px] md:w-[280px] md:flex-none">
          <Search size={17} className="flex-shrink-0 text-faint" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
        <div ref={panelRef} className="relative flex-shrink-0">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Sort & filter"
            className={cn(
              'relative flex h-[44px] w-[44px] items-center justify-center rounded-[9px] border bg-white text-ink',
              activeFilterCount > 0 ? 'border-primary text-primary' : 'border-line',
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10.5px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute top-[calc(100%+8px)] right-0 z-40 w-[300px] rounded-[14px] border border-line bg-white p-4 shadow-[var(--shadow-pop)]">
              <div className="mb-2 px-[3px] text-[10px] font-semibold tracking-[0.05em] text-faint uppercase">Sort by</div>
              <div className="-mx-1">
                {sorts.map((s) => (
                  <div
                    key={s}
                    onClick={() => onSort(s)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg px-[11px] py-[9px] text-[13px]',
                      s === sort ? 'bg-primary-soft font-semibold text-secondary' : 'text-label hover:bg-primary-soft hover:text-secondary',
                    )}
                  >
                    {s}
                    {s === sort && <Check size={14} className="text-primary" />}
                  </div>
                ))}
              </div>
              <div className="my-4 h-px bg-line" />
              <FleetFilters filters={filters} options={filterOptions} onChange={onFilters} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
