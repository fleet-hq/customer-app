'use client';

import { Calendar, ClockFace } from '@/components/ui/icons';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

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
  const iconSize = compact ? 15 : 16;
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
        icon={<Calendar size={iconSize} className="flex-shrink-0 text-primary" />}
      />
      <div className="mx-3 h-4 w-px flex-shrink-0 bg-line" />
      <TimePicker
        value={time}
        onChange={onTime}
        minTime={minTime}
        maxTime={maxTime}
        disabledSlots={disabledSlots}
        className="min-w-0 flex-1"
        aria-label={label ? `${label} time` : 'Time'}
        icon={<ClockFace size={iconSize} className="flex-shrink-0 text-primary" />}
      />
    </div>
  );
}
