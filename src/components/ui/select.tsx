'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check } from '@/components/ui/icons';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  ariaLabel?: string;
}

export function Select({ value, onChange, options, placeholder = 'Choose…', ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-[44px] w-full items-center justify-between gap-[8px] rounded-[12px] border bg-white px-[14px] text-[14.5px] outline-none transition-all',
          open
            ? 'border-primary ring-2 ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]'
            : 'border-card-border',
          value ? 'text-ink' : 'text-placeholder',
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn('flex-shrink-0 text-faint transition-transform', open && 'rotate-180')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute z-20 mt-[6px] max-h-[220px] w-full overflow-auto rounded-[12px] border border-card-border bg-white py-[6px] shadow-[var(--shadow-card)]"
        >
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <li key={opt} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-[8px] px-[14px] py-[9px] text-left text-[14.5px] transition-colors',
                    selected ? 'bg-primary-soft font-semibold text-primary' : 'text-ink hover:bg-subtle',
                  )}
                >
                  <span className="truncate">{opt}</span>
                  {selected ? <Check size={15} className="flex-shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
