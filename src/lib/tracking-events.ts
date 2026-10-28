/** Funnel + conversion signals for whatever tenant tags are loaded on
 *  the page. Every helper no-ops safely when GTM (``dataLayer``) or the
 *  Meta Pixel (``fbq``) aren't present, so call sites don't have to
 *  know which tenant configured what.
 *
 *  Two consumers, one payload:
 *   • GA4 / Google Ads — operators wire their conversions to the
 *     dataLayer events inside their own GTM container. GA4's ecommerce
 *     reports only populate off its exact `items` array schema, so the
 *     shapes below follow it literally.
 *   • Meta Pixel — gets the matching native event. Catalogue and
 *     dynamic-ad retargeting only work when `content_ids` +
 *     `content_type` are present, which is the detail most hand-rolled
 *     GTM setups get wrong, so it's baked in here rather than left to
 *     the call site.
 *
 *  Every event carries an `event_id` that is unique per occurrence.
 *  Meta collapses duplicates sharing an id, so a deterministic one made
 *  every visitor's view of the same vehicle look like a single event and
 *  undercounted the signal campaigns optimise on. `purchase` is the one
 *  exception and stays keyed to the transaction — see below. */

const DEFAULT_CURRENCY = 'USD';

interface TrackedVehicle {
  id: string | number;
  name: string;
  pricePerDay?: number | null;
  vehicleType?: string;
}

interface Win {
  dataLayer?: Record<string, unknown>[];
  fbq?: (...args: unknown[]) => void;
}

function win(): Win | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as Win;
}

/** Meta rejects a value that isn't a positive number ("must be greater
 *  than 0"), and a zero-value conversion is meaningless for ROAS
 *  anyway. Note a "0.00" string is truthy — which is how a zero used to
 *  slip through as a value. */
function positiveValue(value: number | null | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function push(dl: Record<string, unknown>): void {
  const w = win();
  if (!w) return;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(dl);
}

/** One id per occurrence. The prefix keeps it readable in Meta's Test
 *  Events; the timestamp and random suffix are what stop two people
 *  viewing the same vehicle from being merged into one event. */
function newEventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** GTM's data layer model merges pushes by key, so an `items` array left
 *  over from an earlier event bleeds into the next one index by index —
 *  which is why opening one vehicle reported all five. Clearing the
 *  object first is GA4's documented requirement, not a workaround. */
function pushEcommerce(dl: Record<string, unknown>): void {
  push({ ecommerce: null });
  push(dl);
}

function meta(event: string, params: Record<string, unknown>, eventId: string): void {
  const w = win();
  if (!w || typeof w.fbq !== 'function') return;
  w.fbq('track', event, params, { eventID: eventId });
}

/** GA4 wants `item_id`/`item_name`; Meta wants `content_ids`. Deriving
 *  both from one shape keeps the two from drifting apart. */
function ga4Item(v: TrackedVehicle, index?: number) {
  return {
    item_id: String(v.id),
    item_name: v.name,
    ...(v.vehicleType ? { item_category: v.vehicleType } : {}),
    ...(positiveValue(v.pricePerDay) !== undefined ? { price: positiveValue(v.pricePerDay) } : {}),
    ...(index !== undefined ? { index } : {}),
  };
}

/** Step 1 — the fleet listing rendered. GA4 only: Meta's `ViewContent`
 *  means "viewed one item", so firing it for a list too would blur the
 *  browsing signal against genuine interest in a single vehicle, which
 *  is the more valuable audience to retarget. */
export function trackFleetList(vehicles: TrackedVehicle[], listId = 'fleet'): void {
  if (vehicles.length === 0) return;
  pushEcommerce({
    event: 'view_item_list',
    event_id: newEventId(`view_item_list-${listId}`),
    item_list_id: listId,
    ecommerce: {
      item_list_id: listId,
      items: vehicles.map((v, i) => ga4Item(v, i)),
    },
  });
}

/** Step 2 — a vehicle card clicked. GA4 only, deliberately: a custom
 *  Meta event can't drive standard optimisation and would just dilute
 *  the volume Meta needs to learn. */
export function trackVehicleSelect(vehicle: TrackedVehicle, listId = 'fleet'): void {
  pushEcommerce({
    event: 'select_item',
    event_id: newEventId(`select_item-${vehicle.id}`),
    item_list_id: listId,
    ecommerce: { item_list_id: listId, items: [ga4Item(vehicle)] },
  });
}

/** Step 3 — a vehicle's own page opened. This is the real
 *  `ViewContent`: one identifiable vehicle, which is what catalogue
 *  retargeting keys off. */
export function trackVehicleView(vehicle: TrackedVehicle): void {
  const eventId = newEventId(`view_item-${vehicle.id}`);
  const value = positiveValue(vehicle.pricePerDay);

  pushEcommerce({
    event: 'view_item',
    event_id: eventId,
    currency: DEFAULT_CURRENCY,
    ...(value !== undefined ? { value } : {}),
    ecommerce: {
      currency: DEFAULT_CURRENCY,
      ...(value !== undefined ? { value } : {}),
      items: [ga4Item(vehicle)],
    },
  });

  meta(
    'ViewContent',
    {
      content_ids: [String(vehicle.id)],
      content_type: 'product',
      content_name: vehicle.name,
      ...(vehicle.vehicleType ? { content_category: vehicle.vehicleType } : {}),
      currency: DEFAULT_CURRENCY,
      ...(value !== undefined ? { value } : {}),
    },
    eventId,
  );
}

/** Step 4 — checkout started. The highest-volume signal with real
 *  intent behind it, so it's the one worth optimising toward while
 *  direct-booking volume is still too thin for Purchase. */
export function trackBeginCheckout(params: {
  vehicle: TrackedVehicle;
  value?: number | null;
  currency?: string;
  days?: number | null;
}): void {
  const { vehicle } = params;
  const currency = params.currency || DEFAULT_CURRENCY;
  const value = positiveValue(params.value);
  const days = positiveValue(params.days);
  const eventId = newEventId(`begin_checkout-${vehicle.id}`);

  pushEcommerce({
    event: 'begin_checkout',
    event_id: eventId,
    currency,
    ...(value !== undefined ? { value } : {}),
    ...(days !== undefined ? { rental_days: days } : {}),
    ecommerce: {
      currency,
      ...(value !== undefined ? { value } : {}),
      items: [ga4Item(vehicle)],
    },
  });

  meta(
    'InitiateCheckout',
    {
      content_ids: [String(vehicle.id)],
      content_type: 'product',
      content_name: vehicle.name,
      num_items: 1,
      currency,
      ...(value !== undefined ? { value } : {}),
    },
    eventId,
  );
}

/** Step 5 — booking confirmed. Its id stays keyed to the transaction on
 *  purpose: a booking is one real-world event, so a refresh of the
 *  success page must collapse into the same Purchase rather than bill a
 *  second conversion. Uniqueness per occurrence is what the browsing
 *  events need; idempotence is what this one needs. */
export function trackPurchase(params: {
  transactionId: string | number;
  value?: number | null;
  currency?: string;
}): void {
  if (typeof window === 'undefined') return;

  const currency = params.currency || DEFAULT_CURRENCY;
  const value = positiveValue(params.value);
  const eventId = `purchase-${params.transactionId}`;

  pushEcommerce({
    event: 'purchase',
    transaction_id: String(params.transactionId),
    event_id: eventId,
    // Always present, so a GTM tag mapping currency isn't left empty
    // on the bookings we can't price.
    currency,
    ...(value !== undefined ? { value } : {}),
  });

  meta('Purchase', { currency, ...(value !== undefined ? { value } : {}) }, eventId);
}

export type LeadForm = 'inquiry' | 'popup';

export function trackLead(form: LeadForm): void {
  const eventId = newEventId(`generate_lead-${form}`);
  push({ event: 'generate_lead', event_id: eventId, lead_form: form });
  meta('Lead', { content_name: form }, eventId);
}
