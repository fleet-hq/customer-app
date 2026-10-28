const STATE_KEY = 'lead-popup';
const UTM_KEY = 'lead-popup-utm';
const DAY_MS = 24 * 60 * 60 * 1000;

export type PopupState = { state: 'dismissed' | 'submitted'; at: number } | null;

export interface LeadUtm {
  utm_source: string;
  utm_campaign: string;
}

export function readPopupState(): PopupState {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as PopupState) : null;
  } catch {
    return null;
  }
}

export function writePopupState(state: NonNullable<PopupState>): void {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export function popupDue(state: PopupState, dismissDays: number, now = Date.now()): boolean {
  if (!state) return true;
  if (state.state === 'submitted') return false;
  return now - state.at >= dismissDays * DAY_MS;
}

export function rememberLeadUtm(search: string): void {
  const params = new URLSearchParams(search);
  const utm = { utm_source: params.get('utm_source') ?? '', utm_campaign: params.get('utm_campaign') ?? '' };
  if (!utm.utm_source && !utm.utm_campaign) return;
  try {
    window.sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    return;
  }
}

export function readStoredLeadUtm(): LeadUtm {
  try {
    const raw = window.sessionStorage.getItem(UTM_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LeadUtm>) : {};
    return { utm_source: parsed.utm_source ?? '', utm_campaign: parsed.utm_campaign ?? '' };
  } catch {
    return { utm_source: '', utm_campaign: '' };
  }
}
