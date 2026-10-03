'use client';

import { Calendar, ClockFace } from '@/components/ui/icons';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';
import { useTenant } from '@/lib/tenant-context';

interface DateTimeFieldProps {
  date: string;
  time: string;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
  minDate?: string;
  highlightDate?: string;
  unavailableDates?: string[];
  minTime?: string | null;
  maxTime?: string | null;
  /** Disabled "HH:mm" slots for the currently selected ``date``.
   *  Lets parents block the hours of an existing booking inside an
   *  otherwise-available day. */
  disabledSlots?: string[];
  compact?: boolean;
  label?: string;
}

export function DateTimeField({
  date,
  time,
  onDate,
  onTime,
  minDate,
  highlightDate,
  unavailableDates,
  minTime,
  maxTime,
  disabledSlots,
  compact,
  label,
}: DateTimeFieldProps) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const iconSize = compact ? 15 : 16;
  // Template 2's accent is its own brass token, not the brand primary,
  // so these icons have to follow it rather than `text-primary`.
  const iconClass = cn('flex-shrink-0', isT2 ? 'text-[var(--brass)]' : 'text-primary');
  return (
    <div className="flex w-full items-center whitespace-nowrap">
      <DatePicker
        value={date}
        onChange={onDate}
        minDate={minDate}
        highlightDate={highlightDate}
        unavailableDates={unavailableDates}
        className="min-w-0 flex-1"
        aria-label={label ? `${label} date` : 'Date'}
        icon={<Calendar size={iconSize} className={iconClass} />}
      />
      <div className={cn('mx-3 h-4 w-px flex-shrink-0 bg-line', isT2 && 'bg-[var(--line)]')} />
      <TimePicker
        value={time}
        onChange={onTime}
        minTime={minTime}
        maxTime={maxTime}
        disabledSlots={disabledSlots}
        className="min-w-0 flex-1"
        aria-label={label ? `${label} time` : 'Time'}
        icon={<ClockFace size={iconSize} className={iconClass} />}
      />
    </div>
  );
}
