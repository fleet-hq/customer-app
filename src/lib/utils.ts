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

/** The instant a wall-clock date and time refer to in a given zone.
 *
 *  "9:00 on Nov 3 in New York" is a different moment depending on
 *  whether the clocks have gone back, and ``new Date('...T09:00')``
 *  answers for the viewer's own zone instead. A renter browsing from
 *  Karachi would otherwise measure a New York trip with Karachi hours.
 */
export function zonedTimeToMs(
  date: string,
  time: string = '00:00',
  timeZone?: string | null,
): number {
  const wall = Date.parse(`${date}T${time || '00:00'}:00Z`);
  if (Number.isNaN(wall)) return NaN;
  if (!timeZone) return new Date(`${date}T${time || '00:00'}:00`).getTime();

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  // Two passes settle the offset either side of a DST transition.
  let guess = wall;
  for (let i = 0; i < 2; i += 1) {
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(guess)).map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const seen = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
    );
    guess = wall - (seen - guess);
  }
  return guess;
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
  const a = zonedTimeToMs(fromDate, fromTime, timeZone);
  const b = zonedTimeToMs(toDate, toTime, timeZone);
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
