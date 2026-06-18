// Display formatters for booking-related datetimes.
//
// IMPORTANT: this site is the *customer*-facing booking flow. The
// browser's local timezone is usually wrong for tenant-specific data
// — a customer browsing from Asia for a NY rental site should still
// see "10 AM EDT" pickup, not their own local interpretation. Always
// pass `tz` (the tenant's IANA timezone, e.g. "America/New_York")
// when formatting booking pickup/dropoff/created-at moments. The
// timezone defaults to the browser's local zone only as a fallback
// so legacy call sites don't break.

export function formatShortDate(iso: string, tz?: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    ...(tz ? { timeZone: tz } : {}),
  });
}

export function formatTime(iso: string, tz?: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(tz ? { timeZone: tz } : {}),
  });
}
