'use client';

import { cn } from '@/lib/utils';

interface FleetPaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

function pageWindow(page: number, total: number): number[] {
  const max = 5;
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, page - 2);
  const end = Math.min(total, start + max - 1);
  start = Math.max(1, end - max + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const box = 'flex h-10 items-center justify-center rounded-[9px] text-sm font-medium transition-colors';

export function FleetPagination({ page, totalPages, onPage }: FleetPaginationProps) {
  const nums = pageWindow(page, totalPages);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={atStart}
        aria-label="Previous page"
        className={cn(box, 'w-10 border border-line bg-white text-faint disabled:cursor-not-allowed disabled:opacity-40')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          className={cn(
            box,
            'min-w-10 px-2',
            n === page ? 'bg-primary text-white' : 'border border-line bg-white text-ink hover:border-primary',
          )}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onPage(page + 1)}
        disabled={atEnd}
        aria-label="Next page"
        className={cn(box, 'w-10 border border-line bg-white text-ink disabled:cursor-not-allowed disabled:opacity-40')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
      <button
        onClick={() => onPage(totalPages)}
        disabled={atEnd}
        aria-label="Last page"
        className={cn(box, 'w-10 border border-line bg-white text-ink disabled:cursor-not-allowed disabled:opacity-40')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
        </svg>
      </button>
    </div>
  );
}
