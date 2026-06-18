export interface LocationHours {
  start: string | null;
  end: string | null;
  timezone: string | null;
}

export interface TimeSlot {
  value: string;
  label: string;
}

export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const parts = value.split(':').map((part) => parseInt(part, 10));
  const h = parts[0];
  const m = parts[1];
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function format12HourLabel(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function buildLocationTimeSlots(hours: LocationHours, intervalMinutes = 30): TimeSlot[] {
  const startMin = parseTimeToMinutes(hours.start) ?? 0;
  const endMin = parseTimeToMinutes(hours.end) ?? 24 * 60;

  const lower = endMin > startMin ? startMin : 0;
  const upper = endMin > startMin ? endMin : 24 * 60;

  const slots: TimeSlot[] = [];
  for (let minutes = lower; minutes < upper; minutes += intervalMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push({
      value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      label: format12HourLabel(h, m),
    });
  }
  return slots;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
