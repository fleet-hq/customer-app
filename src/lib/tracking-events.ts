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
  const value =
    typeof params.value === 'number' && Number.isFinite(params.value)
      ? params.value
      : undefined;

  const w = window as unknown as {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  };

  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'purchase',
    transaction_id: String(params.transactionId),
    ...(value !== undefined ? { value, currency } : {}),
  });

  if (typeof w.fbq === 'function') {
    w.fbq('track', 'Purchase', value !== undefined ? { value, currency } : {});
  }
}
