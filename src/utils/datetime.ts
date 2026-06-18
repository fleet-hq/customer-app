/**
 * Tenant-timezone datetime utilities (fhq customer site).
 *
 * Mirror of fleet-admin's src/utils/datetime.ts. Keep them in sync —
 * the only intentional differences are import paths.
 *
 * ALL booking / business datetimes (pickup, dropoff, promo expiry,
 * etc.) MUST flow through this module. The naive
 * ``${date}T${time}:00`` concat pattern is FORBIDDEN — the backend
 * interprets such strings as UTC, which silently corrupts a
 * customer's wall-clock intent when they're not in the rental
 * location's timezone.
 *
 * Why: a Mumbai customer renting a NY car who types "10 AM" wants
 * "10 AM at the rental location" — not "10 AM IST". With the naive
 * concat, the backend stores 10:00 UTC, which displays as 6 AM EDT.
 * Off by the entire IST→EDT offset.
 */

import { format } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

// ── Validators ────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

function assertTimeZone(tz: unknown): asserts tz is string {
  if (typeof tz !== "string" || tz.length === 0) {
    throw new Error(
      "datetime: timezone is required (got " + JSON.stringify(tz) + ")",
    );
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    throw new Error(`datetime: invalid timezone "${tz}"`);
  }
}

function assertDate(date: unknown): asserts date is string {
  if (typeof date !== "string" || !DATE_RE.test(date)) {
    throw new Error(
      `datetime: invalid date ${JSON.stringify(date)} — expected "YYYY-MM-DD"`,
    );
  }
}

function assertTime(time: unknown): asserts time is string {
  if (typeof time !== "string" || !TIME_RE.test(time)) {
    throw new Error(
      `datetime: invalid time ${JSON.stringify(time)} — expected "HH:MM" or "HH:MM:SS"`,
    );
  }
}

function parseIso(iso: unknown): Date {
  if (typeof iso !== "string" || iso.length === 0) {
    throw new Error("datetime: ISO string is required");
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`datetime: cannot parse ISO string "${iso}"`);
  }
  return d;
}

// ── Public API ────────────────────────────────────────────────────

/** Wall-clock date + time observed in ``tz`` → canonical UTC ISO. */
export function toUtcIso(date: string, time: string, tz: string): string {
  assertDate(date);
  assertTime(time);
  assertTimeZone(tz);
  const wallClock = time.length === 5 ? `${date}T${time}:00` : `${date}T${time}`;
  const utc = fromZonedTime(wallClock, tz);
  if (Number.isNaN(utc.getTime())) {
    throw new Error(
      `datetime: could not interpret "${wallClock}" as a wall-clock in "${tz}"`,
    );
  }
  return utc.toISOString();
}

/** UTC ISO → ``{date, time}`` for prefilling an Edit form. */
export function utcIsoToFormValues(
  iso: string,
  tz: string,
): { date: string; time: string } {
  const d = parseIso(iso);
  assertTimeZone(tz);
  return {
    date: formatInTimeZone(d, tz, "yyyy-MM-dd"),
    time: formatInTimeZone(d, tz, "HH:mm"),
  };
}

/** UTC ISO → "Mon. 25 May, 2026" in ``tz``. Matches the existing
 *  fhq booking-detail format. */
export function formatLocalDate(iso: string, tz: string): string {
  const d = parseIso(iso);
  assertTimeZone(tz);
  return formatInTimeZone(d, tz, "EEE'.' dd MMM, yyyy");
}

/** UTC ISO → "10:00 AM" in ``tz``. */
export function formatLocalTime(iso: string, tz: string): string {
  const d = parseIso(iso);
  assertTimeZone(tz);
  return formatInTimeZone(d, tz, "hh:mm a");
}

/** Now anchored to ``tz`` — pass to date-fns ``format()``. */
export function getTenantNow(tz: string): Date {
  assertTimeZone(tz);
  return toZonedTime(new Date(), tz);
}

export { format };
