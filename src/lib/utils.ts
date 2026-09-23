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

/**
 * Reads the numeric id back out of an `{id}` or `{id}-{slug}` route param
 * (e.g. "42" or "42-toyota-camry-2023" both resolve to "42"). The slug is
 * cosmetic/SEO-only — the id prefix is always the real lookup key, so this
 * keeps bare-id links working forever even after a car's name changes.
 */
export function idFromSlugParam(param: string): string {
  const match = param.match(/^\d+/);
  return match ? match[0] : param;
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

export function rentalDays(
  fromDate: string,
  toDate: string,
  fromTime: string = '00:00',
  toTime: string = '00:00',
): number {
  const a = new Date(`${fromDate}T${fromTime}:00`);
  const b = new Date(`${toDate}T${toTime}:00`);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 1;
  const hours = Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 3600000));
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
