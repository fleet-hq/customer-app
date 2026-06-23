'use client';

import { useState, useRef, useCallback, useMemo, useEffect, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/use-click-outside';
import { buildLocationTimeSlots, type TimeSlot } from '@/lib/time-slots';

export interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  interval?: number;
  icon?: ReactNode;
  className?: string;
  'aria-label'?: string;
  minTime?: string | null;
  maxTime?: string | null;
  /** Set of "HH:mm" slots to render as disabled — used to grey out
   *  the hours of an existing booking on a partially-blocked day. */
  disabledSlots?: string[];
  disabled?: boolean;
}

const PANEL_HEIGHT = 260;
const GAP = 8;

function formatTimeDisplay(value: string): string {
  const parts = value.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parts[1] ?? '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select Time',
  interval = 30,
  icon,
  className,
  'aria-label': ariaLabel,
  minTime,
  maxTime,
  disabledSlots,
  disabled = false,
}: TimePickerProps) {
  const disabledSlotSet = useMemo(
    () => new Set(disabledSlots ?? []),
    [disabledSlots],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({ position: 'fixed' });
  const [originClass, setOriginClass] = useState('origin-top');

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, close, isOpen);

  const timeSlots = useMemo<TimeSlot[]>(
    () => buildLocationTimeSlots({ start: minTime ?? null, end: maxTime ?? null, timezone: null }, interval),
    [minTime, maxTime, interval],
  );

  useEffect(() => {
    if (isOpen && selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < PANEL_HEIGHT && rect.top > PANEL_HEIGHT;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 168));

    if (openUp) {
      setDropdownStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + GAP, left });
      setOriginClass('origin-bottom');
    } else {
      setDropdownStyle({ position: 'fixed', top: rect.bottom + GAP, left });
      setOriginClass('origin-top');
    }
  }, []);

  const openDropdown = useCallback(() => {
    computePosition();
    setIsOpen(true);
  }, [computePosition]);

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
    if (disabled) return;
    if (isOpen) setIsOpen(false);
    else openDropdown();
  }, [disabled, isOpen, openDropdown]);

  const handleSelect = useCallback(
    (slotValue: string) => {
      onChange(slotValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

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

  return (
    <div ref={containerRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn('flex items-center gap-2 p-0', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}
      >
        {icon}
        <span className={cn('text-sm', value ? 'text-ink' : 'text-placeholder')}>
          {value ? formatTimeDisplay(value) : placeholder}
        </span>
      </button>

      <div
        role="listbox"
        aria-label="Select time"
        style={dropdownStyle}
        className={cn(
          'z-50 min-w-40 rounded-lg border border-line bg-white shadow-[var(--shadow-pop)] transition-all duration-200 ease-out',
          originClass,
          isOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0',
        )}
      >
        <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
          {timeSlots.map((slot) => {
            const selected = slot.value === value;
            const slotDisabled = disabledSlotSet.has(slot.value);
            return (
              <button
                key={slot.value}
                ref={selected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={slotDisabled}
                onClick={() => handleSelect(slot.value)}
                title={slotDisabled ? 'Already booked' : undefined}
                className={cn(
                  'flex w-full px-4 py-2 text-left text-sm transition-colors',
                  slotDisabled
                    ? 'cursor-not-allowed text-faint line-through opacity-60'
                    : selected
                      ? 'bg-hover font-medium text-primary'
                      : 'text-ink hover:bg-subtle',
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
