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
  minTime?: string | null;
  maxTime?: string | null;
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
  minTime,
  maxTime,
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
        className="min-w-0 flex-1"
        aria-label={label ? `${label} time` : 'Time'}
        icon={<ClockFace size={iconSize} className="flex-shrink-0 text-primary" />}
      />
    </div>
  );
}
