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

/** Billable days, counted the way the server counts them
 *  (``common/tz.py::block_days``): hours on the wall clock rounded up,
 *  then 24-hour blocks rounded up.
 *
 *  Reading both ends as UTC is what makes it the wall clock — no zone
 *  has a transition in UTC, so the arithmetic is pure "9am to 9am six
 *  days later is six days". Resolving the two ends into real instants
 *  instead would measure elapsed time, and the night the clocks go back
 *  runs 25 hours, which buys the renter a day they never had.
 */
export function rentalDays(
  fromDate: string,
  toDate: string,
  fromTime: string = '00:00',
  toTime: string = '00:00',
): number {
  const a = Date.parse(`${fromDate}T${fromTime || '00:00'}:00Z`);
  const b = Date.parse(`${toDate}T${toTime || '00:00'}:00Z`);
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
