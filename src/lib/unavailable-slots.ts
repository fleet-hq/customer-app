import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface RawRange {
  start: string;
  end: string;
}

export interface MinuteInterval {
  startMin: number;
  endMin: number;
}

export interface UnavailabilityIndex {
  /** YYYY-MM-DD → list of minute-of-day intervals consumed on that day.
   *  Keys are in the tenant's timezone so a UTC range that spans
   *  midnight gets split into the right local days. */
  rangesByDate: Map<string, MinuteInterval[]>;
  /** Days where the union of intervals covers all 24h — i.e. the
   *  customer can't start or end a rental on that day at all. Days
   *  with partial blocks stay selectable; the time picker handles
   *  intra-day blocking via ``slotsBlockedOn``. */
  fullyBlockedDates: string[];
}

const MIN_PER_DAY = 24 * 60;

function dateKey(d: Date, tz: string | null): string {
  if (tz) return formatInTimeZone(d, tz, 'yyyy-MM-dd');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tzMidnight(key: string, tz: string | null): Date {
  if (tz) return fromZonedTime(`${key}T00:00:00`, tz);
  return new Date(`${key}T00:00:00`);
}

function nextDayKey(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Build an index of unavailable minute intervals per local day from
 *  the backend's ``/api/bookings/public/unavailable-ranges/`` payload.
 *
 *  All key dates are computed in the supplied ``tenantTz`` so a 19:30
 *  UTC block on Jul 7 doesn't get bucketed as Jul 8 for a visitor in
 *  a far-east timezone. Pass ``null`` only when the location has no
 *  configured timezone; the browser's local TZ is then the fallback. */
export function buildUnavailabilityIndex(
  ranges: RawRange[] | undefined,
  tenantTz: string | null,
): UnavailabilityIndex {
  const rangesByDate = new Map<string, MinuteInterval[]>();

  for (const r of ranges ?? []) {
    const start = new Date(r.start);
    const end = new Date(r.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

    let cursorKey = dateKey(start, tenantTz);
    const stopKey = dateKey(new Date(end.getTime() - 1), tenantTz);
    while (cursorKey <= stopKey) {
      const dayStart = tzMidnight(cursorKey, tenantTz).getTime();
      const dayEnd = tzMidnight(nextDayKey(cursorKey), tenantTz).getTime();
      const overlapStart = Math.max(start.getTime(), dayStart);
      const overlapEnd = Math.min(end.getTime(), dayEnd);
      if (overlapStart < overlapEnd) {
        const startMin = Math.floor((overlapStart - dayStart) / 60000);
        const endMin = Math.min(
          MIN_PER_DAY,
          Math.ceil((overlapEnd - dayStart) / 60000),
        );
        const arr = rangesByDate.get(cursorKey) ?? [];
        arr.push({ startMin, endMin });
        rangesByDate.set(cursorKey, arr);
      }
      cursorKey = nextDayKey(cursorKey);
    }
  }

  const fullyBlockedDates: string[] = [];
  for (const [date, intervals] of rangesByDate) {
    const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin);
    let covered = 0;
    let cursor = 0;
    for (const i of sorted) {
      if (i.startMin > cursor) break;
      if (i.endMin > cursor) {
        covered += i.endMin - cursor;
        cursor = i.endMin;
      }
      if (cursor >= MIN_PER_DAY) break;
    }
    if (covered >= MIN_PER_DAY) fullyBlockedDates.push(date);
  }

  return { rangesByDate, fullyBlockedDates };
}

/** Every "HH:mm" 30-min (or ``interval``-min) slot on ``date`` that
 *  overlaps a block, formatted to match the TimePicker's slot values.
 *
 *  ``kind`` matters because the booking-availability backend uses a
 *  half-open overlap test (``existing.pickup < new.dropoff`` AND
 *  ``existing.dropoff > new.pickup``). That means a dropoff lands
 *  EXACTLY on a block's start is fine — the trip ends right when the
 *  block begins — but a pickup at that same moment is blocked. We
 *  encode the boundary asymmetry so the picker doesn't grey out slots
 *  the backend would actually accept. */
export function slotsBlockedOn(
  index: UnavailabilityIndex,
  date: string | undefined,
  kind: 'pickup' | 'dropoff' = 'pickup',
  intervalMinutes = 30,
): string[] {
  if (!date) return [];
  const intervals = index.rangesByDate.get(date);
  if (!intervals?.length) return [];
  const out: string[] = [];
  for (let m = 0; m < MIN_PER_DAY; m += intervalMinutes) {
    const hit = intervals.some((iv) =>
      kind === 'pickup'
        ? iv.startMin <= m && iv.endMin > m
        : iv.startMin < m && iv.endMin >= m,
    );
    if (hit) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
}
