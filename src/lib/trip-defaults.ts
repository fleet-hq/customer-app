import { formatInTimeZone } from 'date-fns-tz';

const DEFAULT_TIME = '09:00';

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function tenantToday(timezone: string | null): string {
  return formatInTimeZone(new Date(), timezone || 'UTC', 'yyyy-MM-dd');
}

export function defaultReturnDate(pickupDate: string): string {
  return shiftDate(pickupDate, 2);
}

export function defaultTrip(timezone: string | null) {
  const pickupDate = shiftDate(tenantToday(timezone), 1);
  return { pickupDate, pickupTime: DEFAULT_TIME, returnDate: defaultReturnDate(pickupDate), returnTime: DEFAULT_TIME };
}
