export const TRACKING_COOKIE = 'fhq_trk';
export const PROMO_COOKIE = 'fhq_promo';
export const VISITOR_COOKIE = 'fhq_vid';
export const WINDOW_DAYS = 30;
export const WINDOW_SECONDS = WINDOW_DAYS * 24 * 60 * 60;

export interface TrackingTag {
  code: string;
  seenAt: string;
}

export function parseTag(value?: string | null): TrackingTag | null {
  if (!value) return null;
  const [code, seenAt] = decodeURIComponent(value).split('|');
  if (!code || !seenAt || Number.isNaN(Date.parse(seenAt))) return null;
  return { code, seenAt };
}

export function tagIsLive(tag: TrackingTag | null, now = Date.now()): tag is TrackingTag {
  return !!tag && now - Date.parse(tag.seenAt) < WINDOW_SECONDS * 1000;
}

export function formatTag(tag: TrackingTag): string {
  return `${tag.code}|${tag.seenAt}`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

export function trackingPayload(): { tracking_code?: string; tracking_seen_at?: string } {
  const tag = parseTag(readCookie(TRACKING_COOKIE));
  return tagIsLive(tag) ? { tracking_code: tag.code, tracking_seen_at: tag.seenAt } : {};
}

export function trackedPromo(): string {
  return decodeURIComponent(readCookie(PROMO_COOKIE) ?? '');
}
