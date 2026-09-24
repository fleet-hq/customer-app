/** Fire a purchase / conversion signal to whatever tenant tags are
 *  loaded on the page. No-ops safely when GTM (``dataLayer``) or the
 *  Meta Pixel (``fbq``) aren't present, so it's safe to call
 *  unconditionally from the post-checkout success page.
 *
 *  Operators wire their GA4 / Google Ads conversions to the ``purchase``
 *  dataLayer event inside their own GTM container; the Meta Pixel gets a
 *  native ``Purchase`` event. Value + currency are included when known
 *  so revenue-based conversions and ROAS work. */
export function trackPurchase(params: {
  transactionId: string | number;
  value?: number | null;
  currency?: string;
}): void {
  if (typeof window === 'undefined') return;

  const currency = params.currency || 'USD';
  // Meta rejects a Purchase whose value isn't a positive number
  // ("must be greater than 0"), and a zero-value conversion is
  // meaningless for ROAS anyway — so send the amount only when it's
  // genuinely positive. Note a "0.00" string is truthy, which is how
  // a zero used to slip through as a value.
  const parsed = Number(params.value);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

  // Stable per booking, so the event fired below and the same
  // conversion arriving from a tenant's own GTM-installed Pixel tag
  // collapse into one in Meta instead of double-counting. It's also
  // the id a server-side Conversions API call would need to dedupe
  // against this browser event.
  const eventId = `purchase-${params.transactionId}`;

  const w = window as unknown as {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  };

  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'purchase',
    transaction_id: String(params.transactionId),
    event_id: eventId,
    // Always present, so a GTM tag mapping currency isn't left empty
    // on the bookings we can't price.
    currency,
    ...(value !== undefined ? { value } : {}),
  });

  if (typeof w.fbq === 'function') {
    w.fbq(
      'track',
      'Purchase',
      { currency, ...(value !== undefined ? { value } : {}) },
      { eventID: eventId },
    );
  }
}
