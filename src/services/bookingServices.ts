import axios from 'axios';
import { getDomainParams } from '@/utils/company';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Check fleet availability for a given date range (public endpoint, no auth)
export async function checkFleetAvailability(
  fleetId: number | string,
  pickupDatetime: string,
  dropoffDatetime: string
): Promise<boolean> {
  try {
    const domainParams = getDomainParams();
    const res = await axios.get<{ available: boolean }>(
      `${API_URL}/api/bookings/public/availability/`,
      {
        params: {
          ...domainParams,
          fleet_id: fleetId,
          pickup_datetime: pickupDatetime,
          dropoff_datetime: dropoffDatetime,
        },
      }
    );
    return res.data.available;
  } catch {
    // If the check fails, let the create endpoint handle it
    return true;
  }
}

// Insurance option from public API
export interface ApiInsuranceOption {
  type: string;
  name: string;
  description: string;
  price: number;
  total_price?: number;
  recommended: boolean;
}

export interface ApiManualInsurancePackage {
  id: number;
  coverage_type: string;
  custom_type_label: string;
  title: string;
  description: string;
  daily_rate: string | number;
  hourly_rate: string | number;
  is_mandatory: boolean;
}

interface ApiInsuranceResponse {
  has_bonzah_account: boolean;
  insurance_options: ApiInsuranceOption[];
  total_price: number;
  manual_insurance_packages?: ApiManualInsurancePackage[];
}

// Transformed for frontend
export interface InsuranceOption {
  id: string;
  title: string;
  price: number;
  totalPrice?: number;
  description?: string;
  features: string[];
}

/** Renter-facing manual package as returned by the extended
 *  ``/api/bookings/public/insurance-options/`` endpoint. Priced in
 *  dollars per day; the customer app displays a running per-package
 *  total based on the booking length. */
export interface ManualInsurancePackage {
  id: number;
  coverageType: string;
  customTypeLabel: string;
  title: string;
  description: string;
  dailyRate: number;
  hourlyRate: number;
  isMandatory: boolean;
}

function transformInsuranceOption(api: ApiInsuranceOption): InsuranceOption {
  return {
    id: api.type.toLowerCase(),
    title: api.name,
    price: Number(api.price),
    totalPrice: api.total_price !== undefined ? Number(api.total_price) : undefined,
    description: api.description,
    features: [api.description],
  };
}

function transformManualPackage(api: ApiManualInsurancePackage): ManualInsurancePackage {
  return {
    id: Number(api.id),
    coverageType: String(api.coverage_type),
    customTypeLabel: String(api.custom_type_label ?? ''),
    title: String(api.title),
    description: String(api.description ?? ''),
    dailyRate: Number(api.daily_rate),
    hourlyRate: Number(api.hourly_rate),
    isMandatory: !!api.is_mandatory,
  };
}

// Fetch insurance options (public endpoint).
// When the booking window is known we pass it through so Bonzah
// quotes per-day rates for THOSE dates / drop_off_time — otherwise
// the rates come from a generic 1-day Same-day quote and the
// pre-checkout total drifts from the binding quote.
export async function getInsuranceOptions(args?: {
  pickupDatetime?: string;
  dropoffDatetime?: string;
}): Promise<InsuranceOption[]> {
  const bundle = await getInsuranceOptionsBundle(args);
  return bundle.bonzahOptions;
}

/** Full insurance-options response, keeping Bonzah + manual package
 *  lists separate so the checkout can render tabs when the tenant has
 *  both providers enabled. Returns an empty bundle on network errors
 *  (matches the legacy fallback so the UI can still show the "I have
 *  my own insurance" option). */
export interface InsuranceOptionsBundle {
  hasBonzah: boolean;
  bonzahOptions: InsuranceOption[];
  manualPackages: ManualInsurancePackage[];
}

export async function getInsuranceOptionsBundle(args?: {
  pickupDatetime?: string;
  dropoffDatetime?: string;
}): Promise<InsuranceOptionsBundle> {
  const ownInsurance: InsuranceOption = {
    id: 'own',
    title: 'I have my own insurance',
    price: 0,
    features: ['Use your personal coverage'],
  };
  try {
    const dateParams: Record<string, string> = {};
    if (args?.pickupDatetime) dateParams.pickup_datetime = args.pickupDatetime;
    if (args?.dropoffDatetime) dateParams.dropoff_datetime = args.dropoffDatetime;
    const res = await axios.get<ApiInsuranceResponse>(
      `${API_URL}/api/bookings/public/insurance-options/`,
      {
        params: { ...getDomainParams(), ...dateParams },
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const hasBonzah = !!res.data.has_bonzah_account;
    const bonzahOptions = Array.isArray(res.data.insurance_options)
      ? res.data.insurance_options.map(transformInsuranceOption)
      : [];
    const manualPackages = Array.isArray(res.data.manual_insurance_packages)
      ? res.data.manual_insurance_packages.map(transformManualPackage)
      : [];
    return {
      hasBonzah,
      bonzahOptions: hasBonzah ? [ownInsurance, ...bonzahOptions] : [ownInsurance],
      manualPackages,
    };
  } catch {
    return {
      hasBonzah: false,
      bonzahOptions: [ownInsurance],
      manualPackages: [],
    };
  }
}

/** Lightweight tenant-scoped manual packages fetch. Doesn't go through
 *  the Bonzah insurance-options endpoint (which waits on a live quote
 *  round-trip), so the Custom tab hydrates immediately even while
 *  Bonzah is still resolving. Public endpoint keyed off the tenant
 *  domain via ``getDomainParams``. */
export async function getManualInsurancePackagesForTenant(): Promise<ManualInsurancePackage[]> {
  try {
    const res = await axios.get<{ packages: ApiManualInsurancePackage[] }>(
      `${API_URL}/api/insurance/public/manual-packages-by-domain/`,
      {
        params: getDomainParams(),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return Array.isArray(res.data?.packages)
      ? res.data.packages.map(transformManualPackage)
      : [];
  } catch {
    return [];
  }
}

// Booking Details Types (matches actual API response)
export interface ApiBooking {
  id: number;
  status: string;
  payment_status: string;
  booking_reference: string;
  hold_expires_at?: string | null;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    dob?: string;
    license_no?: string;
    drivers_license_state?: string;
    identity_verified?: boolean;
    identity_verification_details?: {
      dob: string;
      document_number: string;
      document_expiration_date: string;
      document_type: string;
      city: string;
      state: string;
      street_address_1: string;
      postal_code: string;
    } | null;
  };
  fleet: {
    id: number;
    name: string;
    year: string;
    make: string;
    model: string;
    plate_number: string;
    vin_number?: string;
    description: string;
    seats: number;
    doors: number;
    extras: {
      id: number;
      name: string;
      icon: string | null;
      description: string;
      period: string;
      price: string;
    }[];
    images: {
      id: number;
      fleet: number;
      image: string;
      is_thumbnail: boolean;
    }[];
    booking_rule?: {
      min_driver_age: number | null;
      max_driver_age: number | null;
      miles_unlimited: boolean;
      miles_per_day: string | null;
      miles_overage_rate: string | null;
    } | null;
  };
  pickup_datetime: string;
  dropoff_datetime: string;
  /** IANA timezone resolved server-side from pickup_location →
   *  company → UTC fallback. Display formatters MUST use this so
   *  customers see the rental-location wall-clock, not their own. */
  timezone?: string;
  pickup_location: {
    id: number;
    name: string;
    address: string;
    branch_name: string;
    timezone?: string;
  };
  dropoff_location: {
    id: number;
    name: string;
    address: string;
    branch_name: string;
    timezone?: string;
  };
  base_price: string;
  subtotal: string;
  total_price: string;
  total_discount: string;
  promo_code?: string | null;
  tax: string;
  security_deposit: string;
  location_charges: string;
  fees: string;
  extras_price: string;
  extras: {
    id: number;
    name: string;
    description: string;
    price: string;
    period: string;
    quantity?: number;
  }[];
  insurance_selected: boolean;
  insurance_details: {
    policy_id: string;
    premium_amount: string;
    status: string;
    coverage: {
      cdw_cover: boolean;
      rcli_cover: boolean;
      sli_cover: boolean;
      pai_cover: boolean;
    };
  } | null;
  abi_coverage?: {
    id: number;
    rental_id: string;
    premium_amount: string | null;
    status: string;
    has_comp_coll: boolean;
    start_time: string;
    end_time: string;
  } | null;
  offer: unknown | null;
  created_at: string;
  updated_at: string;
  can_modify?: {
    cancel: boolean;
    swap: boolean;
    reduce: boolean;
    extend: boolean;
  };
}

export interface InsuranceVerificationDetails {
  status: string;
  disposition: string | null;
  carrier: string | null;
  policyNumber: string | null;
  policyStatus: string | null;
  activeStatus: string | null;
  policyExpiryDate: string | null;
  remediationMessages: string[];
}

const INSURANCE_FAILED_DISPOSITIONS = new Set([
  'inadequate', 'failed', 'incomplete', 'unverified',
]);

export function mapInsuranceVerificationDetails(
  raw: unknown,
): InsuranceVerificationDetails | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    status: String(r.status || 'pending'),
    disposition: (r.disposition as string) ?? null,
    carrier: (r.carrier as string) ?? null,
    policyNumber: (r.policy_number as string) ?? null,
    policyStatus: (r.policy_status as string) ?? null,
    activeStatus: (r.active_status as string) ?? null,
    policyExpiryDate: (r.policy_expiry_date as string) ?? null,
    remediationMessages: Array.isArray(r.remediation_messages)
      ? (r.remediation_messages as string[])
      : [],
  };
}

export function isInsuranceFailed(
  status: string | null | undefined,
  details: InsuranceVerificationDetails | null | undefined,
): boolean {
  if (status === 'unverified') return true;
  if (details?.activeStatus === 'inactive') return true;
  if (details?.disposition && INSURANCE_FAILED_DISPOSITIONS.has(details.disposition)) {
    return true;
  }
  return false;
}

export function isInsuranceVerified(
  status: string | null | undefined,
  details: InsuranceVerificationDetails | null | undefined,
): boolean {
  return status === 'verified' && details?.activeStatus !== 'inactive';
}

export interface BookingDetails {
  id: string;
  fleetId: number;
  customerId: number;
  status: string;
  vehicle: {
    name: string;
    licensePlate: string;
    vin: string;
    image: string;
    year: number;
    minDriverAge?: number | null;
    maxDriverAge?: number | null;
    milesUnlimited?: boolean;
    milesPerDay?: number | null;
    milesOverageRate?: number | null;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    dob?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    homeAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  bookedOn: string;
  /** Tenant timezone — pass this to date/time formatters anywhere
   *  on the customer site so a renter abroad sees the rental
   *  location's clock, not their own. Populated from
   *  ``api.timezone`` (resolved server-side). */
  timezone?: string;
  pickUp: {
    address: string;
    date: string;
    time: string;
    rawDatetime: string;
  };
  dropOff: {
    address: string;
    date: string;
    time: string;
    rawDatetime: string;
  };
  invoice: {
    number: string;
    items: {
      name: string;
      image: string;
      quantity: number;
      pricePerDay: number;
      unit?: 'day' | 'hour';
      periodLabel?: string;
    }[];
    extras: {
      name: string;
      price: number;
    }[];
    rentalTotal: number;
    fees: number;
    insurancePremium: number;
    abiPremium: number;
    abiStatus: string | null;
    subtotal: number;
    discount: number;
    discountCode: string;
    tax: number;
    locationCharges: number;
    total: number;
    deposit: number;
    balance: number;
  };
  hasOwnInsurance: boolean;
  insuranceCoverage: {
    cdw: boolean;
    rcli: boolean;
    sli: boolean;
    pai: boolean;
    premiumAmount: number;
    policyId: string;
    status: string;
  } | null;
  verifications: {
    idVerification: string;
    insuranceVerification: string;
    insuranceDetails: InsuranceVerificationDetails | null;
  };
  bookingRef: string;
  totalPrice: string;
  paymentStatus: string;
  holdExpiresAt: string | null;
  agreementId?: number;
  agreementStatus?: string;
  canModify: {
    cancel: boolean;
    swap: boolean;
    reduce: boolean;
    extend: boolean;
  };
  /** Approved modification requests with a positive price_difference —
   *  each one becomes an invoice sub-line under Rental so the customer
   *  sees their original booking + each extension as separate items.
   *  Sourced from the booking API (guaranteed populated) rather than
   *  the billing ledger which may be empty for tenants with the
   *  dual-write flag disabled. */
  extensionMods: {
    id: number;
    type: string;
    priceDifference: number;
    createdAt: string;
  }[];
  /** Frozen tenant-managed insurance packages the renter picked at
   *  checkout. Snapshots so the invoice keeps rendering the exact
   *  title / coverage / rate the renter agreed to even after the
   *  tenant edits the source package. */
  manualInsuranceSelections: {
    id: number;
    packageId: number | null;
    coverageType: string;
    customTypeLabel: string;
    title: string;
    description: string;
    dailyRate: number;
    totalCharged: number;
  }[];
  /** Sum of ``totalCharged`` across ``manualInsuranceSelections``.
   *  Convenience field so the invoice can back out tax without
   *  re-summing on every render. */
  manualInsuranceTotal: number;
}

// Format a stored UTC ISO as the tenant-local date string used on the
// booking detail page (e.g. "Mon. 25 May, 2026"). ``tz`` is the
// booking's tenant timezone — REQUIRED for a Lahore customer viewing a
// New York booking to see the rental-location's clock rather than
// their own. Falls back to browser local only if tz is missing.
function formatBookingDate(dateStr: string, tz?: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(tz ? { timeZone: tz } : {}),
  };
  const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  // Restore the legacy shape: "Mon. 25 May, 2026"
  return `${get('weekday')}. ${get('day')} ${get('month')}, ${get('year')}`;
}

function formatBookingTime(dateStr: string, tz?: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...(tz ? { timeZone: tz } : {}),
  });
}

function formatCreatedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${day}${suffix} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function calculateDays(pickupDate: string, dropoffDate: string): number {
  const start = new Date(pickupDate).getTime();
  const end = new Date(dropoffDate).getTime();
  const hours = Math.max(1, Math.ceil((end - start) / 3600000));
  return Math.max(1, Math.ceil(hours / 24));
}

function calculateHours(pickupDate: string, dropoffDate: string): number {
  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  return Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60)));
}

function transformBooking(api: ApiBooking): BookingDetails {
  const rentalDays = calculateDays(api.pickup_datetime, api.dropoff_datetime);
  const rentalHours = calculateHours(api.pickup_datetime, api.dropoff_datetime);
  const HOURLY_RATE_MAX_HOURS = 23;
  const pricePerDay = Number(api.base_price) || 0;
  const subtotal = Number(api.subtotal) || pricePerDay * rentalDays;
  const discount = Number(api.total_discount) || 0;
  const tax = Number(api.tax) || 0;
  const locationCharges = Number(api.location_charges) || 0;
  const fees = Number(api.fees) || 0;
  // The API's subtotal already bakes in peak/promo dynamic-pricing per
  // day, plus location_charges and extras. To recover the bare rental
  // sum we strip those back out — without this the post-booking invoice
  // showed base_price × days (e.g. \$320 × 7 = \$2240) and silently
  // hid any peak-day surcharges already paid (real rental was \$4960).
  const extrasFromApi = (api.extras || []).reduce(
    (sum, e) => sum + Number(e.price) * (e.quantity || 1),
    0,
  );
  const rentalSum = Math.max(0, subtotal - locationCharges - extrasFromApi);
  // ``api.base_price`` is the day rate stored on the booking — the API
  // doesn't surface ``price_per_hour``, so we infer the billing unit
  // from what was actually charged. When the rental sum equals
  // ``pricePerDay × rentalDays`` we know the backend billed daily;
  // only when the math demands a per-hour rate do we render the item
  // as hourly. This stops short same-day rentals on daily-only fleets
  // (e.g. 7h × $50.22/day = $50.22) from rendering as "7x Base price
  // per hour" — they're correctly "1x Base price per day".
  const dailyRentalSum = pricePerDay * rentalDays;
  const looksDaily =
    pricePerDay > 0 && Math.abs(rentalSum - dailyRentalSum) < 0.01;
  const isHourly = rentalHours <= HOURLY_RATE_MAX_HOURS && !looksDaily;
  const total = Number(api.total_price) || subtotal - discount + tax + locationCharges + fees;
  const deposit = Number(api.security_deposit) || 0;
  const balance = total - deposit;

  const PLACEHOLDER = '/images/vehicles/car_placeholder.png';
  const thumbnailImg = api.fleet.images?.find((img) => img.is_thumbnail);
  const firstImg = api.fleet.images?.[0];
  const imageUrl = thumbnailImg?.image || firstImg?.image || '';
  const vehicleImage = imageUrl && imageUrl.trim() !== '' ? imageUrl : PLACEHOLDER;

  // Build invoice items. unitPrice is the AVERAGE per-unit cost across
  // the booking — for daily bookings with peak/promo dynamic pricing
  // the per-day rate isn't constant, so dividing the actual rental sum
  // by day count gives the right "$X / day" headline AND ensures
  // rentalTotal = unitPrice × quantity matches what was actually
  // charged. Falls back to base_price when the math can't be derived.
  const quantity = isHourly ? rentalHours : rentalDays;
  const unitPrice =
    quantity > 0 && rentalSum > 0
      ? rentalSum / quantity
      : pricePerDay;
  const invoiceItems: BookingDetails['invoice']['items'] = [
    {
      name: `${api.fleet.name} - ${api.fleet.plate_number || 'N/A'}`,
      image: vehicleImage,
      quantity,
      pricePerDay: unitPrice,
      unit: isHourly ? 'hour' : 'day',
    },
  ];


  // Build extras list separately
  const invoiceExtras = (api.extras || []).map((extra) => ({
    name: extra.description || extra.name,
    price: Number(extra.price) * (extra.quantity || 1),
  }));

  return {
    id: String(api.id),
    fleetId: api.fleet.id,
    customerId: api.customer.id,
    status: api.status,
    vehicle: {
      name: api.fleet.name,
      licensePlate: api.fleet.plate_number || 'N/A',
      vin: api.fleet.vin_number || 'N/A',
      image: vehicleImage,
      year: Number(api.fleet.year) || 0,
      minDriverAge: api.fleet.booking_rule?.min_driver_age ?? null,
      maxDriverAge: api.fleet.booking_rule?.max_driver_age ?? null,
      milesUnlimited: api.fleet.booking_rule?.miles_unlimited ?? false,
      milesPerDay: api.fleet.booking_rule?.miles_per_day != null
        ? Number(api.fleet.booking_rule.miles_per_day)
        : null,
      milesOverageRate: api.fleet.booking_rule?.miles_overage_rate != null
        ? Number(api.fleet.booking_rule.miles_overage_rate)
        : null,
    },
    customer: {
      name: `${api.customer.first_name} ${api.customer.last_name}`,
      email: api.customer.email,
      phone: api.customer.phone || 'N/A',
      dob: api.customer.dob || api.customer.identity_verification_details?.dob || undefined,
      licenseNumber: api.customer.license_no || api.customer.identity_verification_details?.document_number || undefined,
      licenseExpiry: api.customer.identity_verification_details?.document_expiration_date || undefined,
      homeAddress: api.customer.identity_verification_details?.street_address_1 || undefined,
      city: api.customer.identity_verification_details?.city || undefined,
      state: api.customer.identity_verification_details?.state || api.customer.drivers_license_state || undefined,
      zip: api.customer.identity_verification_details?.postal_code || undefined,
    },
    bookedOn: formatCreatedDate(api.created_at),
    // Tenant timezone resolved by the backend (location → company →
    // UTC fallback) and surfaced at ``api.timezone``. The display
    // formatters take it explicitly so a customer in any browser TZ
    // sees the rental location's clock — not their own.
    pickUp: {
      address: api.pickup_location?.address || api.pickup_location?.name || 'N/A',
      date: formatBookingDate(api.pickup_datetime, api.timezone),
      time: formatBookingTime(api.pickup_datetime, api.timezone),
      rawDatetime: api.pickup_datetime,
    },
    dropOff: {
      address: api.dropoff_location?.address || api.dropoff_location?.name || 'N/A',
      date: formatBookingDate(api.dropoff_datetime, api.timezone),
      time: formatBookingTime(api.dropoff_datetime, api.timezone),
      rawDatetime: api.dropoff_datetime,
    },
    timezone: api.timezone || api.pickup_location?.timezone || undefined,
    invoice: {
      number: api.booking_reference || String(api.id),
      items: invoiceItems,
      extras: invoiceExtras,
      rentalTotal: rentalSum,
      fees,
      insurancePremium: Number(api.insurance_details?.premium_amount) || 0,
      abiPremium: Number(api.abi_coverage?.premium_amount) || 0,
      abiStatus: (api.abi_coverage?.status as string) || null,
      subtotal,
      discount,
      discountCode: (api.promo_code ?? '').toString().trim(),
      tax,
      locationCharges,
      total,
      deposit,
      balance,
    },
    hasOwnInsurance: !api.insurance_selected,
    insuranceCoverage: api.insurance_selected && api.insurance_details
      ? {
          cdw: api.insurance_details?.coverage?.cdw_cover || false,
          rcli: api.insurance_details?.coverage?.rcli_cover || false,
          sli: api.insurance_details?.coverage?.sli_cover || false,
          pai: api.insurance_details?.coverage?.pai_cover || false,
          premiumAmount: Number(api.insurance_details?.premium_amount) || 0,
          policyId: api.insurance_details?.policy_id || '',
          status: api.insurance_details?.status || '',
        }
      : null,
    verifications: {
      // Read from the same booking-detail payload so the first paint
      // reflects the real verification state — otherwise the customer
      // page briefly showed the Verify Insurance button as clickable
      // even when Modives had already emailed the renter, and each
      // click burned another verification credit while spamming their
      // inbox with a fresh magic link. The parallel useVerificationStatus
      // hook resolves ~1s later; without seeding from booking here,
      // that gap was the whole flash-of-clickable-button window.
      idVerification: (api as unknown as { id_verification_status?: string })
        .id_verification_status ?? 'pending',
      insuranceVerification: (() => {
        const raw = (
          api as unknown as {
            insurance_verification_status?:
              | string
              | { status?: string; [k: string]: unknown };
          }
        ).insurance_verification_status;
        if (typeof raw === 'string') return raw || 'pending';
        return (raw && raw.status) || 'pending';
      })(),
      insuranceDetails: mapInsuranceVerificationDetails(
        (api as unknown as { insurance_verification_status?: unknown }).insurance_verification_status,
      ),
    },
    bookingRef: api.booking_reference || String(api.id),
    totalPrice: api.total_price != null ? String(api.total_price) : '',
    paymentStatus: api.payment_status || '',
    holdExpiresAt: api.hold_expires_at ?? null,
    canModify: api.can_modify || { cancel: false, swap: false, reduce: false, extend: false },
    extensionMods: (Array.isArray((api as any).modification_requests) ? (api as any).modification_requests : [])
      .filter((m: any) => m?.status === 'approved' && Number(m?.price_difference || 0) > 0)
      .map((m: any) => ({
        id: Number(m.id),
        type: String(m.type ?? m.request_type ?? 'modification'),
        priceDifference: Number(m.price_difference || 0),
        createdAt: String(m.created_at ?? ''),
      })),
    manualInsuranceSelections: (Array.isArray((api as any).manual_insurance_selections)
      ? (api as any).manual_insurance_selections
      : []
    ).map((s: any) => ({
      id: Number(s.id),
      packageId: s.package_id != null ? Number(s.package_id) : null,
      coverageType: String(s.coverage_type ?? ''),
      customTypeLabel: String(s.custom_type_label ?? ''),
      title: String(s.title ?? ''),
      description: String(s.description ?? ''),
      dailyRate: Number(s.daily_rate ?? 0),
      totalCharged: Number(s.total_charged ?? 0),
    })),
    manualInsuranceTotal: Number((api as any).manual_insurance_total ?? 0),
  };
}

// Fetch booking by ID (uses X-Booking-Token)
export async function getBookingById(bookingId: number | string): Promise<BookingDetails> {
  try {
    const res = await axios.get<ApiBooking>(
      `${API_URL}/api/bookings/${bookingId}/`,
      { headers: getBookingTokenHeaders() }
    );
    return transformBooking(res.data);
  } catch (error) {
    throw error;
  }
}

// Validate a promo code (public endpoint with domain)
export async function validatePromoCode(params: {
  code: string;
  base_price: number;
  extras_price?: number;
  fees?: number;
  location_charges?: number;
}): Promise<{
  valid: boolean;
  error?: string;
  promo_code_id?: number;
  discount_type?: string;
  discount_value?: string;
  discount_amount?: string;
}> {
  const domainParams = getDomainParams();
  const res = await axios.post(
    `${API_URL}/api/promo-codes/public/validate/`,
    params,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// Customer data for booking
export interface CustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  license_no?: string;
}

// Create booking request payload
export interface CreateBookingPayload {
  fleet_id: number;
  customer: CustomerData;
  pickup_datetime: string;
  dropoff_datetime: string;
  pickup_location_id: number;
  dropoff_location_id?: number;
  insurance_selected: boolean;
  abi_coverage?: boolean;
  cdw_cover: boolean;
  rcli_cover: boolean;
  sli_cover: boolean;
  pai_cover: boolean;
  /** Tenant-managed manual insurance packages the renter picked.
   *  Optional, stacks alongside Bonzah when both providers are
   *  enabled. Snapshots are frozen on the backend at booking create. */
  manual_insurance_package_ids?: number[];
  extras?: { id: number; quantity: number }[];
  discount_code?: string;
  promo_code?: string;
  /** Base64 data URI of the pre-signed rental-agreement signature.
   *  Stashed on PendingBookingCheckout and promoted into a
   *  BookingSignature row when the payment webhook creates the
   *  Booking. Omit when the tenant has no active clauses. */
  signature_image?: string;
}

// Create booking API response
interface CreateBookingResponse {
  booking_id: number;
  booking_reference: string;
  access_token: string;
  token_expires_at: string;
  total_price: string;
  status: string;
  customer_id?: number;
}

// ──────────────────────────────────────────────────────────────────────────
// NEW pre-payment flow — no Booking is created until Stripe confirms payment.
// Single-call replacement for createBooking + createCheckoutSession.
// ──────────────────────────────────────────────────────────────────────────
export interface StartCheckoutPayload extends CreateBookingPayload {
  success_url: string;
  cancel_url: string;
  provider?: 'stripe' | 'square';
}

export interface StartCheckoutResponse {
  checkout_url: string;
  pending_id: string;
  expires_at: string;
  amount: string;
  currency: string;
}

export interface StartEmbedPaymentResponse {
  pending_id: string;
  /** Payment gateway slug: 'stripe' or 'square'. Falls back to
   *  'stripe' for backend versions that predate the abstraction. */
  provider?: 'stripe' | 'square';
  client_secret: string;
  publishable_key: string;
  /** Legacy field kept populated on the Stripe path for backward
   *  compatibility. New callers should read ``provider_account_id``. */
  stripe_account_id: string;
  /** Provider-neutral merchant / connected-account handle. */
  provider_account_id?: string;
  /** Provider-specific extras — Square carries location_id +
   *  environment; Stripe currently sends none. */
  provider_extra?: Record<string, string | number | boolean | null>;
  amount: string;
  currency: string;
  expires_at: string;
}

export async function startEmbedBookingPayment(
  payload: CreateBookingPayload,
  options: { provider?: 'stripe' | 'square' } = {},
): Promise<StartEmbedPaymentResponse> {
  const domainParams = getDomainParams();
  const body = {
    first_name: payload.customer.first_name,
    last_name: payload.customer.last_name,
    email: payload.customer.email,
    phone: payload.customer.phone_no.slice(0, 15),
    ...(payload.customer.license_no ? { license_no: payload.customer.license_no } : {}),
    fleet_id: payload.fleet_id,
    pickup_location_id: payload.pickup_location_id,
    dropoff_location_id: payload.dropoff_location_id || payload.pickup_location_id,
    pickup_datetime: payload.pickup_datetime,
    dropoff_datetime: payload.dropoff_datetime,
    extras: payload.extras || [],
    additional_drivers: 0,
    fuel_pre_purchase: false,
    return_car_to_different_branch: false,
    notes: '',
    insurance_selected: payload.insurance_selected,
    abi_coverage: payload.abi_coverage ?? false,
    cdw_cover: payload.cdw_cover,
    rcli_cover: payload.rcli_cover,
    sli_cover: payload.sli_cover,
    pai_cover: payload.pai_cover,
    ...(payload.manual_insurance_package_ids && payload.manual_insurance_package_ids.length > 0
      ? { manual_insurance_package_ids: payload.manual_insurance_package_ids }
      : {}),
    ...(payload.promo_code ? { promo_code: payload.promo_code } : {}),
    ...(options.provider ? { provider: options.provider } : {}),
    ...(payload.signature_image ? { signature_image: payload.signature_image } : {}),
  };
  const res = await axios.post<StartEmbedPaymentResponse>(
    `${API_URL}/api/bookings/public/start-embed-payment/`,
    body,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}

export interface PublicPaymentProvidersResponse {
  providers: Array<'stripe' | 'square'>;
  default: 'stripe' | 'square';
  /** Square Web Payments SDK credentials — populated when Square is
   *  enabled so the checkout page can mount the Card element inline
   *  without needing a PaymentIntent / PendingBookingCheckout row. */
  square: {
    application_id: string;
    location_id: string;
    environment: 'sandbox' | 'production';
  } | null;
}

export async function getPublicPaymentProviders(): Promise<PublicPaymentProvidersResponse> {
  const domainParams = getDomainParams();
  const res = await axios.get<PublicPaymentProvidersResponse>(
    `${API_URL}/api/companies/public/payment-providers/`,
    { params: domainParams },
  );
  return res.data;
}

export async function startBookingCheckout(
  payload: StartCheckoutPayload,
): Promise<StartCheckoutResponse> {
  const domainParams = getDomainParams();
  const body = {
    first_name: payload.customer.first_name,
    last_name: payload.customer.last_name,
    email: payload.customer.email,
    phone: payload.customer.phone_no.slice(0, 15),
    ...(payload.customer.license_no ? { license_no: payload.customer.license_no } : {}),
    fleet_id: payload.fleet_id,
    pickup_location_id: payload.pickup_location_id,
    dropoff_location_id: payload.dropoff_location_id || payload.pickup_location_id,
    pickup_datetime: payload.pickup_datetime,
    dropoff_datetime: payload.dropoff_datetime,
    extras: payload.extras || [],
    additional_drivers: 0,
    fuel_pre_purchase: false,
    return_car_to_different_branch: false,
    notes: '',
    insurance_selected: payload.insurance_selected,
    abi_coverage: payload.abi_coverage ?? false,
    cdw_cover: payload.cdw_cover,
    rcli_cover: payload.rcli_cover,
    sli_cover: payload.sli_cover,
    pai_cover: payload.pai_cover,
    ...(payload.manual_insurance_package_ids && payload.manual_insurance_package_ids.length > 0
      ? { manual_insurance_package_ids: payload.manual_insurance_package_ids }
      : {}),
    ...(payload.promo_code ? { promo_code: payload.promo_code } : {}),
    ...(payload.provider ? { provider: payload.provider } : {}),
    ...(payload.signature_image ? { signature_image: payload.signature_image } : {}),
    success_url: payload.success_url,
    cancel_url: payload.cancel_url,
  };
  const res = await axios.post<StartCheckoutResponse>(
    `${API_URL}/api/bookings/public/start-checkout/`,
    body,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}

export interface BookingFromSession {
  booking_id: number;
  booking_reference: string;
  access_token: string;
  token_expires_at: string;
  status: string;
  payment_status: string;
  total_price: string;
}

export class BookingNotReadyYet extends Error {
  stripeStatus: string;
  constructor(stripeStatus: string) {
    super(`Booking not ready (stripe payment_status=${stripeStatus})`);
    this.stripeStatus = stripeStatus;
  }
}

export async function getBookingBySession(
  sessionId: string,
): Promise<BookingFromSession> {
  const domainParams = getDomainParams();
  const res = await axios.get<BookingFromSession | { status: string; stripe_payment_status: string }>(
    `${API_URL}/api/bookings/public/by-session/`,
    {
      params: { ...domainParams, session_id: sessionId },
      headers: { 'Content-Type': 'application/json' },
      validateStatus: (s) => s === 200 || s === 202 || s === 404,
    },
  );
  if (res.status === 202) {
    const body = res.data as { stripe_payment_status: string };
    throw new BookingNotReadyYet(body.stripe_payment_status);
  }
  if (res.status === 404) {
    throw new Error('Checkout session not found.');
  }
  return res.data as BookingFromSession;
}

// ──────────────────────────────────────────────────────────────────────────
// Legacy two-step flow — kept until backend is fully migrated.
// ──────────────────────────────────────────────────────────────────────────

// Create a new booking via public endpoint (handles customer creation server-side)
export async function createBooking(payload: CreateBookingPayload): Promise<{ id: number; bookingToken: string; customerId: number }> {
  try {
    const domainParams = getDomainParams();
    const bookingPayload = {
      first_name: payload.customer.first_name,
      last_name: payload.customer.last_name,
      email: payload.customer.email,
      phone: payload.customer.phone_no.slice(0, 15),
      fleet_id: payload.fleet_id,
      pickup_location_id: payload.pickup_location_id,
      dropoff_location_id: payload.dropoff_location_id || payload.pickup_location_id,
      pickup_datetime: payload.pickup_datetime,
      dropoff_datetime: payload.dropoff_datetime,
      extras: payload.extras || [],
      additional_drivers: 0,
      fuel_pre_purchase: false,
      return_car_to_different_branch: false,
      notes: '',
      insurance_selected: payload.insurance_selected,
      abi_coverage: payload.abi_coverage ?? false,
      cdw_cover: payload.cdw_cover,
      rcli_cover: payload.rcli_cover,
      sli_cover: payload.sli_cover,
      pai_cover: payload.pai_cover,
      ...(payload.manual_insurance_package_ids && payload.manual_insurance_package_ids.length > 0
        ? { manual_insurance_package_ids: payload.manual_insurance_package_ids }
        : {}),
      ...(payload.promo_code ? { promo_code: payload.promo_code } : {}),
    };

    const res = await axios.post<CreateBookingResponse>(
      `${API_URL}/api/bookings/public/create/`,
      bookingPayload,
      {
        params: domainParams,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    // Store booking token for subsequent API calls
    const token = res.data.access_token;
    if (token) {
      setBookingToken(token);
    }

    const bookingId = res.data.booking_id;

    // Get customer_id: prefer from create response, otherwise fetch from booking details
    let customerId = res.data.customer_id || 0;

    if (!customerId && token) {
      try {
        // Raw GET to extract customer_id — avoids fragile transformBooking
        const bookingRes = await axios.get<{ customer?: { id?: number } }>(
          `${API_URL}/api/bookings/${bookingId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Booking-Token': token,
            },
          }
        );
        customerId = bookingRes.data?.customer?.id || 0;
      } catch {
        // Could not fetch booking details for customer_id; continue with default
      }
    }

    return {
      id: bookingId,
      bookingToken: token,
      customerId,
    };
  } catch (error) {
    throw error;
  }
}

// Cancel a booking (uses X-Booking-Token)
export async function cancelBooking(
  bookingId: number | string,
  reason: string = 'Payment failed'
): Promise<void> {
  await axios.post(
    `${API_URL}/api/bookings/${bookingId}/cancel/`,
    { cancellation_reason: reason },
    { headers: getBookingTokenHeaders() }
  );
}

// Lookup a booking by ID + last name/email (public, no auth)
export interface BookingLookupPayload {
  booking_id: string;
  last_name?: string;
  email?: string;
}

export interface LookupBookingItem {
  id: number;
  booking_reference: string;
  booking_token: string;
  status: string;
  payment_status: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  timezone?: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  vehicle: {
    name: string;
    plate_number: string;
    image: string | null;
  };
}

export interface BookingLookupResponse {
  searched_booking_id: number;
  booking_token: string;
  customer_name: string;
  bookings: LookupBookingItem[];
}

export async function lookupBooking(payload: BookingLookupPayload): Promise<BookingLookupResponse> {
  const domainParams = getDomainParams();
  const res = await axios.post<BookingLookupResponse>(
    `${API_URL}/api/bookings/public/lookup/`,
    payload,
    {
      params: domainParams,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return res.data;
}

// Booking Driver Types
export interface BookingDriver {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  identity_verified: boolean;
}

// Get booking drivers (uses X-Booking-Token)
export async function getBookingDrivers(bookingId: number | string): Promise<BookingDriver[]> {
  try {
    const res = await axios.get<BookingDriver[] | { results: BookingDriver[] }>(
      `${API_URL}/api/bookings/${bookingId}/booking-driver/`,
      { headers: getBookingTokenHeaders() }
    );
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  } catch {
    return [];
  }
}

// Create a booking driver (uses X-Booking-Token)
export async function createBookingDriver(
  bookingId: number | string,
  driver: { full_name: string; email: string; phone: string }
): Promise<BookingDriver> {
  const res = await axios.post<BookingDriver>(
    `${API_URL}/api/bookings/${bookingId}/booking-driver/`,
    driver,
    { headers: getBookingTokenHeaders() }
  );
  return res.data;
}
