import { fromZonedTime } from 'date-fns-tz';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Kebab-cases free text for use in a URL segment, e.g. "Toyota Camry" -> "toyota-camry". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function money(n: number): string {
  return '$' + n.toFixed(2);
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${days[d.getDay()]}, ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** A wall clock read in the rental's zone, the same conversion the
 *  booking itself is built with (``toUtcIso``). Without a zone it falls
 *  back to the viewer's, which is only safe for display. */
function wallClockMs(date: string, time: string, timeZone?: string | null): number {
  const wall = `${date}T${time || '00:00'}:00`;
  if (!timeZone) return new Date(wall).getTime();
  try {
    return fromZonedTime(wall, timeZone).getTime();
  } catch {
    return new Date(wall).getTime();
  }
}

/** Billable days, counted the way the backend counts them
 *  (``common/tz.py::block_days``): elapsed hours rounded up, then 24-hour
 *  blocks rounded up. Pass the rental location's zone — without it a
 *  trip across a DST change is measured an hour short and loses a day. */
export function rentalDays(
  fromDate: string,
  toDate: string,
  fromTime: string = '00:00',
  toTime: string = '00:00',
  timeZone?: string | null,
): number {
  const a = wallClockMs(fromDate, fromTime, timeZone);
  const b = wallClockMs(toDate, toTime, timeZone);
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  const hours = Math.max(1, Math.ceil((b - a) / 3600000));
  return Math.max(1, Math.ceil(hours / 24));
}

function parseDateLocal(date: Date | string): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T00:00:00');
  return new Date(date);
}

export function formatDate(date: Date | string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(parseDateLocal(date));
}

export function formatDateTime(dateStr: string | null, tz?: string | null): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return parseDateLocal(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(tz ? { timeZone: tz } : {}),
  });
}
