'use client';

import { useState, useRef, useCallback, useMemo, useEffect, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/use-click-outside';
import { computeAnchoredPanelPosition } from '@/lib/anchored-position';
import { useLocale } from '@/lib/i18n/locale-context';
import { useTenant } from '@/lib/tenant-context';

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  highlightDate?: string;
  unavailableDates?: string[];
  icon?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

const PANEL_HEIGHT = 320;
const PANEL_WIDTH = 256;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isSameDay(year: number, month: number, day: number, compare: Date): boolean {
  return compare.getFullYear() === year && compare.getMonth() === month && compare.getDate() === day;
}

function formatDisplay(value: string, intlLocale: string): string {
  const date = new Date(value + 'T00:00:00');
  return date.toLocaleDateString(intlLocale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
  minDate,
  maxDate,
  highlightDate,
  unavailableDates,
  icon,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const isT2 = useTenant().websiteTemplate === 'template_2';
  const unavailableSet = useMemo(() => new Set(unavailableDates ?? []), [unavailableDates]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => (value ? new Date(value + 'T00:00:00') : new Date()));
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({ position: 'fixed' });
  const [originClass, setOriginClass] = useState('origin-top');

  const locale = useLocale();
  const intlLocale = locale === 'es' ? 'es-ES' : 'en-US';
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(2023, 0, 1 + i)
          .toLocaleDateString(intlLocale, { weekday: 'short' })
          .replace('.', '')
          .slice(0, 2),
      ),
    [intlLocale],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, close, isOpen);

  const today = useMemo(() => new Date(), []);

  const { year, month, leadingBlanks, days } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    return {
      year: y,
      month: m,
      leadingBlanks: Array.from<null>({ length: getFirstDayOfMonth(y, m) }),
      days: Array.from({ length: getDaysInMonth(y, m) }, (_, i) => i + 1),
    };
  }, [viewDate]);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const { style, origin } = computeAnchoredPanelPosition(triggerRef.current, {
      panelWidth: PANEL_WIDTH,
      panelHeight: PANEL_HEIGHT,
    });
    setDropdownStyle(style);
    setOriginClass(origin);
  }, []);

  const openDropdown = useCallback(() => {
    computePosition();
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    } else if (minDate) {
      setViewDate(new Date(minDate + 'T00:00:00'));
    }
    setIsOpen(true);
  }, [value, minDate, computePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = () => computePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, computePosition]);

  const toggle = useCallback(() => {
    if (isOpen) setIsOpen(false);
    else openDropdown();
  }, [isOpen, openDropdown]);

  const handleSelect = useCallback(
    (dateStr: string) => {
      onChange(dateStr);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const prevMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [isOpen],
  );

  const monthLabel = viewDate.toLocaleDateString(intlLocale, { month: 'long', year: 'numeric' });

  return (
    <div ref={containerRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="flex cursor-pointer items-center gap-2 p-0"
      >
        {icon}
        <span
          className={cn(
            'text-sm',
            isT2
              ? value
                ? 'text-[var(--text)]'
                : 'text-[var(--text-muted)]'
              : value
                ? 'text-ink'
                : 'text-placeholder',
          )}
        >
          {value ? formatDisplay(value, intlLocale) : placeholder}
        </span>
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose date"
        style={dropdownStyle}
        className={cn(
          'z-50 w-[280px] shadow-[var(--shadow-pop)] transition-all duration-200 ease-out sm:w-64',
          isT2
            ? 'rounded-[3px] border border-[var(--line)] bg-[var(--card)]'
            : 'rounded-lg border border-line bg-white',
          originClass,
          isOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b px-3 py-2.5',
            isT2 ? 'border-[var(--line)]' : 'border-hairline',
          )}
        >
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className={cn(
              'p-1 transition-colors',
              isT2
                ? 'rounded-[2px] text-[var(--text-muted)] hover:text-[var(--brass)]'
                : 'rounded-md text-faint hover:bg-hover hover:text-ink',
            )}
          >
            <ChevronLeftIcon />
          </button>
          <span className={cn('text-sm font-medium', isT2 ? 'text-[var(--text)]' : 'text-ink')}>{monthLabel}</span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className={cn(
              'p-1 transition-colors',
              isT2
                ? 'rounded-[2px] text-[var(--text-muted)] hover:text-[var(--brass)]'
                : 'rounded-md text-faint hover:bg-hover hover:text-ink',
            )}
          >
            <ChevronRightIcon />
          </button>
        </div>

        <div className="grid grid-cols-7 px-3 pt-2">
          {weekdays.map((day, i) => (
            <div
              key={i}
              className={cn(
                'py-1 text-center text-xs font-medium',
                isT2 ? 'text-[var(--text-muted)]' : 'text-faint',
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 px-3 pt-1 pb-3" role="grid">
          {leadingBlanks.map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = toDateString(year, month, day);
            const selected = dateStr === value;
            const isToday = isSameDay(year, month, day, today);
            const isHighlighted = highlightDate !== undefined && dateStr === highlightDate;
            const isBlocked = unavailableSet.has(dateStr);
            const disabled =
              (minDate !== undefined && dateStr < minDate) || (maxDate !== undefined && dateStr > maxDate) || isBlocked;

            return (
              <button
                key={day}
                type="button"
                role="gridcell"
                aria-selected={selected}
                disabled={disabled}
                title={isBlocked ? 'Unavailable' : undefined}
                onClick={() => handleSelect(dateStr)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center text-sm transition-colors sm:h-8 sm:w-8',
                  isT2 ? 'rounded-[2px]' : 'rounded-md',
                  isT2
                    ? cn(
                        selected && 'bg-[var(--brass)] font-medium text-[var(--on-brass)]',
                        !selected &&
                          isHighlighted &&
                          'bg-[color-mix(in_srgb,var(--brass)_14%,var(--card))] font-medium text-[var(--brass)]',
                        !selected &&
                          !isHighlighted &&
                          isToday &&
                          !isBlocked &&
                          'border border-[var(--brass)] font-medium text-[var(--brass)]',
                        !selected &&
                          !isHighlighted &&
                          !isToday &&
                          !disabled &&
                          'text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--brass)_10%,var(--card))]',
                        disabled && !isBlocked && 'cursor-not-allowed text-[var(--text-muted)] opacity-50',
                        isBlocked && 'cursor-not-allowed text-[var(--text-muted)] line-through opacity-50',
                      )
                    : cn(
                        selected && 'bg-primary font-medium text-white',
                        !selected && isHighlighted && 'bg-primary/10 font-medium text-primary ring-1 ring-primary/30',
                        !selected && !isHighlighted && isToday && !isBlocked && 'border border-primary font-medium text-primary',
                        !selected && !isHighlighted && !isToday && !disabled && 'text-ink hover:bg-hover',
                        disabled && !isBlocked && 'cursor-not-allowed text-placeholder',
                        isBlocked && 'cursor-not-allowed text-placeholder line-through',
                      ),
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
