/** Multi-day discount tiers — single source of truth for both the
 *  homepage banner and the fleet-listing pricing label.
 *
 *  TODO: pull these from the backend once per-fleet (or per-company)
 *  custom-discount data ships through ``/api/companies/public/...``.
 *  Today they're hardcoded to match what the fleet page already used. */
export interface DiscountTier {
  minDays: number;
  pct: number;
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minDays: 7, pct: 10 },
  { minDays: 14, pct: 15 },
  { minDays: 30, pct: 20 },
];

/** Active tier for a given rental length — the highest tier whose
 *  ``minDays`` is satisfied. ``null`` when the user hasn't reached
 *  even the first threshold. */
export function activeTier(days: number, tiers: DiscountTier[] = DISCOUNT_TIERS): DiscountTier | null {
  let active: DiscountTier | null = null;
  for (const t of tiers) if (days >= t.minDays) active = t;
  return active;
}

/** Next tier the user could unlock by adding more days. ``null``
 *  when they're already at or past the top tier. */
export function nextTier(days: number, tiers: DiscountTier[] = DISCOUNT_TIERS): DiscountTier | null {
  for (const t of tiers) if (t.minDays > days) return t;
  return null;
}

/** Derived banner copy:
 *
 *  - No tiers configured → ``null`` (hide the banner).
 *  - User hasn't picked dates yet → marketing teaser using the
 *    smallest tier ("Rent X+ days and Y% comes off the daily rate").
 *  - User picked dates short of the next tier → nudge text
 *    ("Add N more days to save Y% per day…").
 *  - User is already on the top tier → ``null`` (no upsell to make).
 */
export interface DiscountBanner {
  text: string;
  /** When set, the banner is encouraging the user to extend — the
   *  FE may want to surface a CTA that pre-fills the dates. */
  addDays?: number;
  pct: number;
}

export function buildDiscountBanner(
  days: number | null,
  tiers: DiscountTier[] = DISCOUNT_TIERS,
): DiscountBanner | null {
  if (tiers.length === 0) return null;
  if (days == null || days <= 0) {
    const first = tiers[0];
    return {
      text: `Rent ${first.minDays}+ days and ${first.pct}% comes off the daily rate.`,
      pct: first.pct,
    };
  }
  const upcoming = nextTier(days, tiers);
  if (!upcoming) return null; // Already on the top tier.
  const addDays = upcoming.minDays - days;
  const plural = addDays === 1 ? 'day' : 'days';
  return {
    text: `Add ${addDays} more ${plural} to save ${upcoming.pct}% per day. Rent ${upcoming.minDays}+ days and ${upcoming.pct}% comes off the daily rate.`,
    addDays,
    pct: upcoming.pct,
  };
}
