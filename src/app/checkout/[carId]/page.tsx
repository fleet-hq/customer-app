'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackLink } from '@/components/ui/back-link';
import { TextInput, FieldError } from '@/components/ui/field';
import { PhoneInput } from '@/components/ui/phone-input';
import { DateTimeField } from '@/components/search/date-time-field';
import { Check, Info, Pencil, ImageIcon, Close, ChevronLeft, ChevronDown, ShieldCheck } from '@/components/ui/icons';
import { DEFAULT_TRIP } from '@/lib/mock-data';
import { useFleet, useInsuranceOptions, useStartBookingCheckout, useCompanyLocations, useFleetUnavailableRanges } from '@/hooks';
import { useBookingInvoice } from '@/hooks/useBookingInvoice';
import { useDefaultTaxProfile } from '@/hooks/useTaxProfiles';
import { useBookingVerificationPolicy, useStartVerificationFirstBooking } from '@/hooks/useBookingPolicy';
import { getBookingVerificationPolicy } from '@/services/bookingPolicyServices';
import { useDefaultLocation } from '@/contexts';
import { checkFleetAvailability, validatePromoCode } from '@/services/bookingServices';
import type { InsuranceOption } from '@/services/bookingServices';
import { toUtcIso } from '@/utils/datetime';
import { todayISO } from '@/lib/time-slots';
import { cn, money, rentalDays } from '@/lib/utils';
import { paths } from '@/lib/paths';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.png';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTripStamp(dateIso: string, time: string): string {
  const d = new Date(dateIso + 'T00:00:00');
  const month = isNaN(d.getTime()) ? '' : MONTHS[d.getMonth()];
  const day = isNaN(d.getTime()) ? dateIso : d.getDate();
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${month} ${day}, ${h12}:${m} ${period}`;
}

const SPEC_ICONS: Record<string, React.ReactNode> = {
  seats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
  transmission: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M6 8v8M18 8v3a3 3 0 0 1-3 3H8" />
    </svg>
  ),
  fuel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12" />
      <path d="M13 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3" />
    </svg>
  ),
  year: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  mileage: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13l3-3M12 5V3M5 5l1 1M19 5l-1 1" />
    </svg>
  ),
};

const EXTRA_ICON = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
  </svg>
);

type Fields = { name: string; email: string; phone: string; license: string };

const MIN_PER_DAY = 24 * 60;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeUnavailableDates(ranges: { start: string; end: string }[]): string[] {
  const byDate = new Map<string, { startMin: number; endMin: number }[]>();
  for (const r of ranges) {
    let cur = new Date(r.start);
    const end = new Date(r.end);
    if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime())) continue;
    while (cur < end) {
      const dayStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0, 0);
      const nextDay = new Date(dayStart.getTime() + MIN_PER_DAY * 60000);
      const segEnd = end < nextDay ? end : nextDay;
      const startMin = Math.floor((cur.getTime() - dayStart.getTime()) / 60000);
      const endMin = Math.ceil((segEnd.getTime() - dayStart.getTime()) / 60000);
      const key = dayKey(dayStart);
      const arr = byDate.get(key) ?? [];
      arr.push({ startMin, endMin });
      byDate.set(key, arr);
      cur = nextDay;
    }
  }
  const out: string[] = [];
  for (const [date, intervals] of byDate) {
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
    if (covered >= MIN_PER_DAY) out.push(date);
  }
  return out;
}

export default function Page({ params }: { params: Promise<{ carId: string }> }) {
  const { carId } = use(params);
  const router = useRouter();

  const { data: vehicle, isLoading } = useFleet(carId);
  const { data: insuranceOptions } = useInsuranceOptions();
  const { data: companyLocations } = useCompanyLocations();
  const defaultLoc = useDefaultLocation();
  const startCheckout = useStartBookingCheckout();
  const { data: verificationPolicy } = useBookingVerificationPolicy();
  const startVerification = useStartVerificationFirstBooking();
  const { data: unavailableRanges = [] } = useFleetUnavailableRanges(carId);
  const { data: defaultTaxProfile } = useDefaultTaxProfile();
  const unavailableDates = useMemo(() => computeUnavailableDates(unavailableRanges), [unavailableRanges]);
  const protectionRef = useRef<HTMLHeadingElement>(null);

  const [selectedInsurance, setSelectedInsurance] = useState<Set<string>>(new Set());
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [fields, setFields] = useState<Fields>({ name: '', email: '', phone: '', license: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [checkoutError, setCheckoutError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tripOpen, setTripOpen] = useState(false);
  const [pickupLocId, setPickupLocId] = useState<string | null>(null);
  const [dropoffLocId, setDropoffLocId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState(DEFAULT_TRIP.pickupDate);
  const [pickupTime, setPickupTime] = useState(DEFAULT_TRIP.pickupTime);
  const [returnDate, setReturnDate] = useState(DEFAULT_TRIP.returnDate);
  const [returnTime, setReturnTime] = useState(DEFAULT_TRIP.returnTime);

  useEffect(() => {
    if (pickupLocId || !companyLocations?.length) return;
    const pickupLocs = companyLocations.filter((l) => l.type === 'pickup' || l.type === 'both');
    const dropoffLocs = companyLocations.filter((l) => l.type === 'dropoff' || l.type === 'both');
    const def =
      pickupLocs.find((l) => String(l.id) === String(defaultLoc?.id)) ?? pickupLocs[0] ?? companyLocations[0];
    setPickupLocId(String(def.id));
    const dropDef =
      dropoffLocs.find((l) => String(l.id) === String(def.id)) ?? dropoffLocs[0] ?? def;
    setDropoffLocId(String(dropDef.id));
  }, [companyLocations, defaultLoc, pickupLocId]);

  const days = rentalDays(pickupDate, returnDate, pickupTime, returnTime);
  const rentalHours = useMemo(() => {
    const pickupMs = new Date(`${pickupDate}T${pickupTime || '00:00'}:00`).getTime();
    const dropoffMs = new Date(`${returnDate}T${returnTime || '00:00'}:00`).getTime();
    if (Number.isNaN(pickupMs) || Number.isNaN(dropoffMs)) return Math.max(1, days * 24);
    return Math.max(1, Math.ceil((dropoffMs - pickupMs) / 3600000));
  }, [pickupDate, pickupTime, returnDate, returnTime, days]);

  const selectedExtras = useMemo<Record<string, { enabled: boolean; quantity: number }>>(() => {
    const out: Record<string, { enabled: boolean; quantity: number }> = {};
    Object.entries(extras).forEach(([id, qty]) => {
      out[id] = { enabled: qty > 0, quantity: qty };
    });
    return out;
  }, [extras]);

  const vehicleData = useMemo(
    () =>
      vehicle
        ? {
            pricePerDay: vehicle.pricePerDay,
            pricePerHour: vehicle.pricePerHour,
            autoCapEnabled: vehicle.autoCapEnabled,
            discounts: vehicle.discounts,
            securityDeposit: vehicle.securityDeposit,
            bookingFee: vehicle.bookingFee,
            taxProfile: vehicle.taxProfile,
            image: vehicle.images?.[0] ?? PLACEHOLDER_IMAGE,
            name: vehicle.name,
            licensePlate: vehicle.licensePlate,
            description: vehicle.description ?? '',
            extras: vehicle.extras ?? [],
          }
        : null,
    [vehicle],
  );

  const { pricing, extraInvoiceItems, insuranceLabel } = useBookingInvoice({
    vehicleData,
    rentalDays: days,
    rentalHours,
    pickupDate,
    dropoffDate: returnDate,
    selectedInsurance,
    insuranceOptions: insuranceOptions ?? [],
    selectedExtras,
    companyLocations: companyLocations ?? [],
    pickupLocationId: pickupLocId,
    dropoffLocationId: dropoffLocId,
    appliedDiscount: promoApplied ? promoDiscount : 0,
    discountCode: promoApplied ? promoCode : undefined,
    defaultTaxProfile,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1180px] flex-1 items-center justify-center px-6 py-24 text-center text-muted">Loading vehicle…</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col items-center justify-center px-6 py-24 text-center text-muted">
          <div className="mb-4">
            <BackLink href={paths.fleet}>Back to fleet</BackLink>
          </div>
          Vehicle not found.
        </div>
      </div>
    );
  }

  const plans: InsuranceOption[] = insuranceOptions ?? [];
  const recommendedPlanId = (plans.find((p) => p.price > 0) ?? plans[0])?.id ?? null;
  const selectedPlans = plans.filter((p) => selectedInsurance.has(p.id) && p.id !== 'own');
  const ownSelected = selectedInsurance.has('own');

  const galleryImages = vehicle.images.length > 0 ? vehicle.images : ['/images/car-cherokee.png'];

  const discount = pricing.discount;
  const total = pricing.total;

  const isInsuranceDisabled = (id: string) => id === 'sli' && !selectedInsurance.has('rcli');
  const toggleInsurance = (id: string) => {
    setSelectedInsurance((prev) => {
      const next = new Set(prev);
      if (id === 'own') {
        if (next.has('own')) next.delete('own');
        else {
          next.clear();
          next.add('own');
        }
        return next;
      }
      next.delete('own');
      if (next.has(id)) {
        next.delete(id);
        if (id === 'rcli') next.delete('sli');
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const gallery = galleryImages;
  const photoCount = galleryImages.length;

  const setField = (key: keyof Fields, val: string) => {
    setFields((f) => ({ ...f, [key]: val }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const blurField = (key: keyof Fields) => {
    const f = fields;
    let msg = '';
    if (key === 'email') {
      if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) msg = 'Please enter a valid email address.';
    } else if (key === 'phone') {
      if (f.phone && f.phone.replace(/\D/g, '').length < 7) msg = 'Phone number must have at least 7 digits.';
    }
    if (msg) setErrors((e) => ({ ...e, [key]: msg }));
  };

  const setExtra = (id: string, delta: number) => {
    setExtras((s) => ({ ...s, [id]: Math.max(0, (s[id] || 0) + delta) }));
  };

  const handlePickupDate = (d: string) => {
    setPickupDate(d);
    if (!returnDate || d > returnDate) setReturnDate(d);
  };

  const validate = () => {
    const f = fields;
    const e: Partial<Record<keyof Fields, string>> = {};
    if (!f.name.trim()) e.name = "Please enter the driver's name";
    if (!f.email) e.email = 'Email address is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'Enter a valid email address';
    if (!f.phone) e.phone = 'Phone number is required';
    else if (f.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
    if (!f.license.trim()) e.license = "Driver's license is required";
    return e;
  };

  const reserve = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setCheckoutError('');

    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      setCheckoutError('Please select a pick-up date, pick-up time, return date, and return time.');
      return;
    }

    const hasLocations = (companyLocations?.length ?? 0) > 0;
    if (hasLocations && !pickupLocId) {
      setCheckoutError('Please select a pickup location for your rental.');
      return;
    }

    const tz = defaultLoc?.timezone ?? null;
    if (!tz) {
      setCheckoutError("Couldn't determine the rental location's timezone, please refresh.");
      return;
    }

    const toIso = (d: string, t: string) => toUtcIso(d, t, tz);
    const pickupDatetime = toIso(pickupDate, pickupTime);
    const dropoffDatetime = toIso(returnDate, returnTime);

    const isAvailable = await checkFleetAvailability(vehicle.id, pickupDatetime, dropoffDatetime);
    if (!isAvailable) {
      setCheckoutError('This vehicle was just booked for those dates. Please choose a different time slot or vehicle.');
      return;
    }

    const pickupLocationId = Number(pickupLocId ?? defaultLoc?.id ?? 0);
    const dropoffLocationId = Number(dropoffLocId ?? pickupLocId ?? defaultLoc?.id ?? 0);
    const nameParts = fields.name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '-';
    const activeExtraItems = vehicle.extras
      .filter((x) => (extras[x.id] || 0) > 0)
      .map((x) => ({ id: Number(x.id), quantity: extras[x.id] }))
      .filter((x) => !Number.isNaN(x.id));
    const insuranceSelected = !selectedInsurance.has('own') && selectedInsurance.size > 0;
    const origin = window.location.origin;

    let freshPolicyMode = verificationPolicy?.mode;
    try {
      const fresh = await getBookingVerificationPolicy();
      freshPolicyMode = fresh.mode;
    } catch {
      void 0;
    }

    if (freshPolicyMode === 'before') {
      const sharedPayload = {
        first_name: firstName,
        last_name: lastName,
        email: fields.email.trim(),
        phone: fields.phone.trim().slice(0, 15),
        fleet_id: Number(vehicle.id),
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        pickup_datetime: pickupDatetime,
        dropoff_datetime: dropoffDatetime,
        insurance_selected: insuranceSelected,
        cdw_cover: selectedInsurance.has('cdw'),
        rcli_cover: selectedInsurance.has('rcli'),
        sli_cover: selectedInsurance.has('sli'),
        pai_cover: selectedInsurance.has('pai'),
        extras: activeExtraItems.length > 0 ? activeExtraItems : [],
        fuel_pre_purchase: false,
        return_car_to_different_branch: false,
        additional_drivers: 0,
        notes: '',
        ...(promoApplied && promoCode ? { promo_code: promoCode } : {}),
      };
      startVerification.mutate(sharedPayload as Record<string, unknown>, {
        onSuccess: (data) => {
          window.location.href = `/booking/${data.booking_id}?token=${encodeURIComponent(data.access_token)}`;
        },
        onError: () => {
          setCheckoutError('Could not start verification. Please try again.');
        },
      });
      return;
    }

    try {
      const data = await startCheckout.mutateAsync({
        fleet_id: Number(vehicle.id),
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: fields.email.trim(),
          phone_no: fields.phone.trim().slice(0, 15),
        },
        pickup_datetime: pickupDatetime,
        dropoff_datetime: dropoffDatetime,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        insurance_selected: insuranceSelected,
        cdw_cover: selectedInsurance.has('cdw'),
        rcli_cover: selectedInsurance.has('rcli'),
        sli_cover: selectedInsurance.has('sli'),
        pai_cover: selectedInsurance.has('pai'),
        extras: activeExtraItems.length > 0 ? activeExtraItems : undefined,
        ...(promoApplied && promoCode ? { discount_code: promoCode, promo_code: promoCode } : {}),
        success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/${carId}`,
      });
      window.location.href = data.checkout_url;
    } catch {
      setCheckoutError('We couldn’t start checkout. Please check your details and try again.');
    }
  };

  const applyPromo = async () => {
    const c = promoInput.trim().toUpperCase();
    if (!c) {
      setPromoError('Enter a promo code');
      return;
    }
    try {
      const result = await validatePromoCode({
        code: c,
        base_price: pricing.subtotal - pricing.insuranceCost - pricing.extrasCost,
        extras_price: pricing.insuranceCost + pricing.extrasCost,
        fees: pricing.bookingFee,
        location_charges: pricing.locationCharges,
      });
      if (result.valid && result.discount_amount) {
        setPromoApplied(true);
        setPromoCode(c);
        setPromoDiscount(parseFloat(result.discount_amount));
        setPromoInput('');
        setPromoError('');
      } else {
        setPromoError(result.error || `“${c}” is not a valid code`);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `“${c}” is not a valid code`;
      setPromoError(message);
    }
  };

  const scrollProtection = () => {
    const el = protectionRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  };

  const hasErrors = Object.keys(errors).length > 0;
  const locs = companyLocations ?? [];
  const pickupLocations = locs.filter((l) => l.type === 'pickup' || l.type === 'both');
  const dropoffLocations = locs.filter((l) => l.type === 'dropoff' || l.type === 'both');
  const selectedPickup = locs.find((l) => String(l.id) === String(pickupLocId));
  const selectedDropoff = locs.find((l) => String(l.id) === String(dropoffLocId));
  const pickupCity = (selectedPickup?.name ?? '').split(',')[0];
  const dropoffCity = (selectedDropoff?.name ?? selectedPickup?.name ?? '').split(',')[0];
  const minTime = selectedPickup && !selectedPickup.is247 ? selectedPickup.openingTime : null;
  const maxTime = selectedPickup && !selectedPickup.is247 ? selectedPickup.closingTime : null;

  return (
    <div className="bg-white text-ink">
      <div className="mx-auto max-w-[1180px] px-6 pt-[22px] pb-16">
        <div className="mb-4 flex items-center justify-between gap-4">
          <BackLink href={paths.fleet}>Back to fleet</BackLink>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          <div>
            <div className="mb-[14px] flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-secondary">
                  {vehicle.name} {vehicle.year}
                </h2>
                <div className="mt-[5px] flex items-center gap-2 text-[12.5px] text-muted">
                  <span>Plate {vehicle.licensePlate}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[19px] font-bold text-secondary">{money(vehicle.pricePerDay)}</div>
                <div className="text-[11px] text-muted">per day</div>
              </div>
            </div>

            <div className="mb-[18px] flex gap-[10px]">
              <div
                onClick={() => {
                  setGalleryIndex(0);
                  setGalleryOpen(true);
                }}
                className="relative h-[256px] flex-[1.7] cursor-pointer rounded-[12px] bg-cover bg-center"
                style={{ backgroundImage: `url('${galleryImages[0]}')` }}
              >
                {vehicle.vehicleType && (
                  <span className="absolute left-3 top-3 rounded-[7px] bg-secondary/90 px-[10px] py-[5px] text-[11px] font-semibold text-white">
                    {vehicle.vehicleType}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-[10px]">
                <div
                  onClick={() => {
                    setGalleryIndex(1);
                    setGalleryOpen(true);
                  }}
                  className="flex-1 cursor-pointer rounded-[12px] bg-cover"
                  style={{ backgroundImage: `url('${galleryImages[1] ?? galleryImages[0]}')`, backgroundPosition: '22% center' }}
                />
                <div
                  onClick={() => {
                    setGalleryIndex(2);
                    setGalleryOpen(true);
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center rounded-[12px] bg-cover"
                  style={{
                    backgroundImage: `linear-gradient(rgba(19,19,20,0.5), rgba(19,19,20,0.5)), url('${galleryImages[2] ?? galleryImages[0]}')`,
                    backgroundPosition: '75% center',
                  }}
                >
                  <span className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-white">
                    <ImageIcon size={16} strokeWidth={1.8} className="text-white" />
                    View all {photoCount} photos
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-[14px] rounded-[12px] border border-card-border px-4 py-[15px]">
              {[
                { key: 'seats', label: 'Seats', value: vehicle.seats ? String(vehicle.seats) : '' },
                { key: 'transmission', label: 'Transmission', value: vehicle.transmission },
                { key: 'fuel', label: 'Fuel', value: vehicle.fuelType },
                { key: 'year', label: 'Year', value: vehicle.year ? String(vehicle.year) : '' },
                { key: 'mileage', label: 'Mileage', value: vehicle.milesPerDay ? `${vehicle.milesPerDay} mi/day` : 'Unlimited' },
              ]
                .filter((s) => s.value)
                .map(({ key, label, value }) => (
                  <div key={key} className="flex items-center gap-[10px]">
                    {SPEC_ICONS[key]}
                    <div>
                      <div className="text-[10.5px] text-muted">{label}</div>
                      <div className="text-[13px] font-semibold">{value}</div>
                    </div>
                  </div>
                ))}
            </div>

            {vehicle.description && (
              <>
                <h3 className="mb-[10px] text-[15px] font-semibold text-ink">About this vehicle</h3>
                <div className="mb-[26px] text-[13px] leading-[1.7] text-muted">
                  <p>{vehicle.description}</p>
                </div>
              </>
            )}

            <h3 ref={protectionRef} className="mb-3 text-[15px] font-semibold text-ink">
              Protection
            </h3>
            <div className="mb-[26px] grid grid-cols-2 gap-[10px]">
              {plans.map((p) => {
                const sel = selectedInsurance.has(p.id);
                const disabled = isInsuranceDisabled(p.id);
                const hasDetail = !!INSURANCE_DETAILS[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (disabled) return;
                      if (hasDetail) setDetailId(p.id);
                      else toggleInsurance(p.id);
                    }}
                    className={cn(
                      'relative flex flex-col rounded-[12px] p-[14px] transition-colors',
                      disabled
                        ? 'cursor-not-allowed border border-line bg-subtle opacity-70'
                        : sel
                          ? 'cursor-pointer border-[1.5px] border-primary bg-primary-soft'
                          : 'cursor-pointer border border-line bg-white',
                    )}
                  >
                    {recommendedPlanId === p.id && !disabled && (
                      <span className="absolute right-3 top-3 rounded-[5px] bg-primary px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[0.03em] text-white">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-center gap-[9px]">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!disabled) toggleInsurance(p.id);
                        }}
                        className={cn(
                          'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                          sel ? 'border-primary bg-primary' : 'border-control bg-white',
                        )}
                      >
                        {sel && <Check size={12} strokeWidth={3} className="text-white" />}
                      </span>
                      <span className="text-[13.5px] font-semibold text-ink">{p.title}</span>
                    </div>
                    <div className="mt-[9px] flex-1 text-[12px] leading-[1.5] text-muted">{p.description}</div>
                    <div className={cn('mt-3 text-[16px] font-bold', sel ? 'text-primary' : 'text-ink')}>
                      {p.price === 0 ? '$0.00' : money(p.price)}
                      <span className="text-[11px] font-normal text-muted">{p.price === 0 ? '' : '/day'}</span>
                    </div>
                    {disabled ? (
                      <div className="mt-3 border-t border-hairline pt-[10px]">
                        <span className="inline-flex items-center rounded bg-amber-bg border border-amber-border px-[7px] py-[3px] text-[10px] font-semibold text-amber-text-2">
                          Requires RCLI
                        </span>
                      </div>
                    ) : hasDetail ? (
                      <div className={cn('mt-3 border-t pt-[10px]', sel ? 'border-primary-border' : 'border-hairline')}>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailId(p.id);
                          }}
                          className="inline-flex cursor-pointer items-center gap-[5px] text-[11.5px] font-semibold text-primary"
                        >
                          <Info size={13} strokeWidth={2} />
                          See what&apos;s covered
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <h3 className="mb-3 text-[15px] font-semibold text-ink">Add extras</h3>
            <div className="mb-[26px] flex flex-col gap-[10px]">
              {vehicle.extras.map((x) => {
                const count = extras[x.id] || 0;
                const active = count > 0;
                return (
                  <div
                    key={x.id}
                    className={cn(
                      'flex items-center gap-[13px] rounded-[11px] p-[12px_14px] transition-colors',
                      active ? 'border-[1.5px] border-primary bg-primary-soft' : 'border border-line bg-white',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px]',
                        active ? 'bg-white' : 'bg-chip',
                      )}
                    >
                      <span className={cn('flex', active ? 'text-primary' : 'text-faint')}>{EXTRA_ICON}</span>
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{x.title}</div>
                      <div className="mt-px text-[11px] text-muted">{x.description}</div>
                      <div className="mt-[3px] text-[12px] font-semibold text-primary">{money(x.price)}{x.priceUnit}</div>
                    </div>
                    {active ? (
                      <div className="flex flex-shrink-0 items-center overflow-hidden rounded-[8px] bg-primary">
                        <span
                          onClick={() => setExtra(x.id, -1)}
                          className="flex h-[34px] w-[32px] cursor-pointer items-center justify-center text-[18px] text-white"
                        >
                          −
                        </span>
                        <span className="min-w-[22px] text-center text-[13px] font-semibold text-white">{count}</span>
                        <span
                          onClick={() => setExtra(x.id, 1)}
                          className="flex h-[34px] w-[32px] cursor-pointer items-center justify-center text-[18px] text-white"
                        >
                          +
                        </span>
                      </div>
                    ) : (
                      <span
                        onClick={() => setExtra(x.id, 1)}
                        className="cursor-pointer rounded-[8px] border border-dash px-[18px] py-2 text-[13px] font-semibold text-secondary"
                      >
                        Add
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className="mb-3 text-[15px] font-semibold text-ink">Driver details</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-[14px]">
              <div>
                <TextInput value={fields.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full name" error={!!errors.name} />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </div>
              <div>
                <TextInput type="email" value={fields.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => blurField('email')} placeholder="Email address" error={!!errors.email} />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </div>
              <div>
                <PhoneInput value={fields.phone} onChange={(v) => setField('phone', v)} onBlur={() => blurField('phone')} error={!!errors.phone} placeholder="Phone number" />
                {errors.phone && <FieldError>{errors.phone}</FieldError>}
              </div>
              <div>
                <TextInput value={fields.license} onChange={(e) => setField('license', e.target.value)} placeholder="Driver's license no." error={!!errors.license} />
                {errors.license && <FieldError>{errors.license}</FieldError>}
              </div>
            </div>

          </div>

          <div className="rounded-2xl border border-card-border bg-subtle p-[22px] lg:sticky lg:top-[88px]">
            <div className="mb-3 text-sm font-semibold text-ink">Your trip</div>
            <div className="flex flex-col gap-2">
              <div
                onClick={() => setTripOpen(true)}
                className="flex cursor-pointer items-center justify-between rounded-[10px] border border-card-border bg-white px-[13px] py-[11px]"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.03em] text-muted">Pick-up</div>
                  <div className="mt-[2px] text-[12.5px] font-semibold text-secondary">{pickupCity} · {formatTripStamp(pickupDate, pickupTime)}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  Edit <Pencil size={12} strokeWidth={2} />
                </span>
              </div>
              <div
                onClick={() => setTripOpen(true)}
                className="flex cursor-pointer items-center justify-between rounded-[10px] border border-card-border bg-white px-[13px] py-[11px]"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.03em] text-muted">Drop-off</div>
                  <div className="mt-[2px] text-[12.5px] font-semibold text-secondary">{dropoffCity} · {formatTripStamp(returnDate, returnTime)}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  Edit <Pencil size={12} strokeWidth={2} />
                </span>
              </div>
            </div>
            <div className="my-[18px] h-px bg-card-border" />

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Price details</span>
              <span className="rounded-full border border-line bg-white px-[10px] py-[3px] text-[11px] font-medium text-muted">{days} days</span>
            </div>

            {vehicle.isPeakPricing && (
              <div className="mb-4 rounded-[9px] border border-amber-border bg-amber-bg px-3 py-[9px] text-[11.5px] font-medium text-amber-text-2">
                Peak-day pricing is in effect for the selected dates.
              </div>
            )}
            {vehicle.isPromoPricing && (
              <div className="mb-4 rounded-[9px] border border-green-border-2 bg-green-bg px-3 py-[9px] text-[11.5px] font-medium text-success">
                Promo pricing is in effect for the selected dates.
              </div>
            )}

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Rental</div>
            <div className="flex items-start justify-between text-[13px]">
              <div>
                <div className="font-medium text-ink">Car rental</div>
                <div className="mt-px text-[11.5px] text-muted">
                  {pricing.rateUnit === 'hour'
                    ? `${money(vehicle.pricePerHour)} × ${rentalHours} ${rentalHours === 1 ? 'hour' : 'hours'}`
                    : `${money(vehicle.pricePerDay)} × ${days} ${days === 1 ? 'day' : 'days'}`}
                </div>
              </div>
              <span className="font-medium text-ink">{money(pricing.subtotal - pricing.insuranceCost - pricing.extrasCost)}</span>
            </div>
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Insurance{insuranceLabel ? ` (${insuranceLabel})` : ''}</span>
              <span onClick={scrollProtection} className="cursor-pointer text-[11px] font-semibold text-primary">Change</span>
            </div>
            {selectedPlans.length > 0 ? (
              <div className="flex flex-col gap-[10px]">
                {selectedPlans.map((p) => (
                  <div key={p.id} className="flex items-start justify-between text-[13px]">
                    <div>
                      <div className="font-medium text-ink">{p.title}</div>
                      <div className="mt-px text-[11.5px] text-muted">{money(p.price)} × {days} days</div>
                    </div>
                    <span className="font-medium text-ink">{money(p.totalPrice ?? p.price * days)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start justify-between text-[13px]">
                <div className="font-medium text-ink">{ownSelected ? 'Own insurance' : 'No protection selected'}</div>
                <span className="font-medium text-ink">{money(0)}</span>
              </div>
            )}
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Add-ons</div>
            {extraInvoiceItems.length > 0 ? (
              <div className="flex flex-col gap-[10px]">
                {extraInvoiceItems.map((a) => (
                  <div key={a.name} className="flex items-start justify-between text-[13px]">
                    <div className="font-medium text-ink">{a.name}</div>
                    <span className="font-medium text-ink">{money(a.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-placeholder">None added yet</span>
                <span className="font-medium text-muted">$0.00</span>
              </div>
            )}
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Discounts</div>
            {/* Duration-based fleet discount — shown when a daily,
                weekly or hourly tier has fired. Distinct from the
                promo-code row below so the customer sees exactly where
                each saving comes from. */}
            {pricing.fleetDiscount > 0 && pricing.fleetDiscountTier && (
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-[7px]">
                  <span className="font-medium text-primary">
                    {pricing.fleetDiscountTier.unitType === 'week'
                      ? 'Weekly discount'
                      : pricing.fleetDiscountTier.unitType === 'hour'
                        ? 'Hourly discount'
                        : 'Long-rental discount'}
                  </span>
                  <span className="inline-flex items-center rounded-[5px] bg-primary-soft px-[7px] py-[2px] text-[10px] font-semibold text-primary">
                    {pricing.fleetDiscountTier.percentage}% OFF
                  </span>
                </div>
                <span className="font-semibold text-primary">−{money(pricing.fleetDiscount)}</span>
              </div>
            )}
            {promoApplied && (
              <div className={cn(
                'flex items-center justify-between text-[13px]',
                pricing.fleetDiscount > 0 ? 'mt-2' : '',
              )}>
                <div className="flex items-center gap-[7px]">
                  <span className="font-medium text-primary">Promo</span>
                  <span className="inline-flex items-center gap-[5px] rounded-[5px] bg-primary-soft py-[2px] pl-[7px] pr-[5px] text-[10px] font-semibold text-primary">
                    {promoCode}
                    <span onClick={() => setPromoApplied(false)} className="cursor-pointer text-[11px] leading-none">
                      ✕
                    </span>
                  </span>
                </div>
                <span className="font-semibold text-primary">−{money(promoDiscount)}</span>
              </div>
            )}
            <div
              className={cn(
                'mt-3 flex items-center gap-[10px] rounded-[9px] border bg-white py-1 pl-[13px] pr-1',
                promoError ? 'border-danger' : 'border-line',
              )}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-faint)" strokeWidth={1.7}>
                <path d="M9 9h.01M15 15h.01M16 8l-8 8" />
                <rect x="3" y="3" width="18" height="18" rx="4" />
              </svg>
              <input
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  setPromoError('');
                }}
                placeholder="Enter promo code"
                className="flex-1 border-none bg-transparent text-[12.5px] text-ink outline-none"
              />
              <span onClick={applyPromo} className="cursor-pointer rounded-[7px] bg-secondary px-4 py-2 text-[12px] font-semibold text-white">
                Apply
              </span>
            </div>
            {promoError && <FieldError>{promoError}</FieldError>}
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Charges &amp; taxes</div>
            <div className="flex flex-col gap-[10px] text-[13px]">
              {pricing.locationCharges > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Location charges</span>
                  <span className="font-medium text-ink">{money(pricing.locationCharges)}</span>
                </div>
              )}
              {pricing.bookingFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Booking fees</span>
                  <span className="font-medium text-ink">{money(pricing.bookingFee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted">Tax</span>
                <span className="font-medium text-ink">{money(pricing.tax)}</span>
              </div>
            </div>
            <div className="my-4 h-px bg-card-border" />

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[15px] font-bold text-ink">Total</div>
                {promoApplied && (
                  <div className="mt-[2px] inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Check size={12} strokeWidth={2.4} />
                    You&apos;re saving {money(discount)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="mr-[3px] text-[11px] text-muted">USD</span>
                <span className="text-[22px] font-bold text-secondary">{money(total)}</span>
              </div>
            </div>

            {pricing.deposit > 0 && (
              <>
                <div className="my-4 h-px bg-card-border" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-ink">Security deposit</span>
                  <span className="font-semibold text-ink">{money(pricing.deposit)}</span>
                </div>
                <div className="mt-[6px] text-[11px] leading-[1.5] text-muted">Refundable hold, collected separately at pick-up.</div>
              </>
            )}

            {(hasErrors || checkoutError) && (
              <div className="mt-4 flex items-center gap-[7px] rounded-[9px] border border-danger-border bg-danger-bg px-3 py-[9px] text-[11.5px] leading-[1.4] text-danger-text">
                <Info size={14} strokeWidth={2} className="flex-shrink-0 text-danger" />
                {checkoutError || 'Please fix the highlighted fields to continue.'}
              </div>
            )}

            <button
              onClick={reserve}
              disabled={startCheckout.isPending || startVerification.isPending || !termsAccepted}
              className="mt-[14px] block w-full cursor-pointer rounded-[10px] bg-primary py-[13px] text-center text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startCheckout.isPending || startVerification.isPending ? 'Starting checkout…' : 'Reserve Now'}
            </button>

            <label className="mt-[13px] flex cursor-pointer items-center gap-[10px]">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="sr-only"
              />
              <span
                className={cn(
                  'inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                  termsAccepted ? 'border-primary bg-primary' : 'border-control bg-white',
                )}
              >
                {termsAccepted && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className="text-[11.5px] leading-[1.5] text-muted">
                I have read and agree to the{' '}
                <Link
                  href={paths.terms}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-primary underline"
                >
                  Terms &amp; Conditions
                </Link>
                .
              </span>
            </label>

            <div className="mt-4 flex flex-col gap-[9px]">
              {['Free cancellation up to 48h', 'No hidden fees — price you see is final', 'Encrypted, secure payment'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[11.5px] text-muted">
                  <Check size={14} strokeWidth={2} className="text-primary" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {galleryOpen && (
        <div
          onClick={() => setGalleryOpen(false)}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[rgba(12,14,12,0.92)] p-10"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[920px]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {vehicle.name} · {galleryIndex + 1} / {gallery.length}
              </span>
              <span
                onClick={() => setGalleryOpen(false)}
                className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)] text-white"
              >
                <Close size={18} strokeWidth={2} />
              </span>
            </div>
            <div
              className="relative aspect-[16/10] w-full rounded-[14px] bg-ink-2 bg-cover bg-center"
              style={{ backgroundImage: `url('${gallery[galleryIndex]}')` }}
            >
              <span
                onClick={() => setGalleryIndex((i) => (i + gallery.length - 1) % gallery.length)}
                className="absolute left-[14px] top-1/2 flex h-[42px] w-[42px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] text-ink"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </span>
              <span
                onClick={() => setGalleryIndex((i) => (i + 1) % gallery.length)}
                className="absolute right-[14px] top-1/2 flex h-[42px] w-[42px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] text-ink"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </div>
            <div className="mt-[14px] flex gap-2 overflow-x-auto">
              {gallery.map((src, i) => (
                <div
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={cn(
                    'h-[56px] w-[78px] flex-shrink-0 cursor-pointer rounded-[8px] border-2 bg-cover bg-center',
                    i === galleryIndex ? 'border-primary opacity-100' : 'border-transparent opacity-60',
                  )}
                  style={{ backgroundImage: `url('${src}')` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {detailId && (
        <InsuranceDetailModal
          option={plans.find((x) => x.id === detailId) ?? null}
          selected={selectedInsurance.has(detailId)}
          disabled={isInsuranceDisabled(detailId)}
          onToggle={() => toggleInsurance(detailId)}
          onClose={() => setDetailId(null)}
        />
      )}

      {tripOpen && (
        <div
          onClick={() => setTripOpen(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(12,14,12,0.55)] p-6"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[460px] rounded-2xl bg-white p-[26px] shadow-[var(--shadow-pop)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-[18px] font-semibold text-secondary">Edit your trip</h3>
              <span onClick={() => setTripOpen(false)} className="cursor-pointer text-muted">
                <Close size={20} strokeWidth={2} />
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted">Pick-up location</div>
                <select
                  value={pickupLocId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setPickupLocId(id);
                    if (!dropoffLocId || dropoffLocId === pickupLocId) {
                      const match = dropoffLocations.find((l) => String(l.id) === id);
                      if (match) setDropoffLocId(id);
                    }
                  }}
                  className="h-[46px] w-full rounded-[10px] border border-line bg-white px-[14px] text-sm text-ink outline-none transition-colors focus:border-primary"
                >
                  {pickupLocations.length === 0 && <option value="">No locations available</option>}
                  {pickupLocations.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted">Drop-off location</div>
                <select
                  value={dropoffLocId ?? ''}
                  onChange={(e) => setDropoffLocId(e.target.value)}
                  className="h-[46px] w-full rounded-[10px] border border-line bg-white px-[14px] text-sm text-ink outline-none transition-colors focus:border-primary"
                >
                  {dropoffLocations.length === 0 && <option value="">No locations available</option>}
                  {dropoffLocations.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted">Pick-up date &amp; time</div>
                <div className="rounded-[9px] border border-line px-[14px] py-3">
                  <DateTimeField
                    date={pickupDate}
                    time={pickupTime}
                    onDate={handlePickupDate}
                    onTime={setPickupTime}
                    minDate={todayISO()}
                    minTime={minTime}
                    maxTime={maxTime}
                    unavailableDates={unavailableDates}
                    label="Pick-up"
                  />
                </div>
              </div>
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted">Return date &amp; time</div>
                <div className="rounded-[9px] border border-line px-[14px] py-3">
                  <DateTimeField
                    date={returnDate}
                    time={returnTime}
                    onDate={setReturnDate}
                    onTime={setReturnTime}
                    minDate={pickupDate || todayISO()}
                    minTime={minTime}
                    maxTime={maxTime}
                    highlightDate={pickupDate}
                    unavailableDates={unavailableDates}
                    label="Return"
                  />
                </div>
              </div>
            </div>
            <button onClick={() => setTripOpen(false)} className="mt-[22px] w-full rounded-[9px] bg-primary py-3 text-center text-sm font-semibold text-white">
              Update trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface InsuranceDetailContent {
  fullTitle: string;
  description: string;
  whyBuyTitle: string;
  whyBuyPoints: string[];
  coverageTitle: string;
  coverageFeatures: string[];
  brochureUrl: string;
}

const INSURANCE_DETAILS: Record<string, InsuranceDetailContent> = {
  cdw: {
    fullTitle: 'Collision Damage Warranty (CDW)',
    description: 'Covers physical damages to the rental vehicle when there is an accident with another vehicle.',
    whyBuyTitle: 'Why buy primary damage?',
    whyBuyPoints: [
      'If you have an auto policy, though prefer not to risk a premium increase in case you damage the rental car. Or..',
      "If you don't have an auto and/or normally use a credit card that only provides secondary damage insurance. Or..",
      'If you normally drive a commercial vehicle, which has insurance that does not cover you for damage to the rental car.',
    ],
    coverageTitle: 'Affordable Rental Vehicle Damage Insurance',
    coverageFeatures: [
      'Up to $35,000 Damage',
      '$1,000 Deductible',
      'Primary Insurance for accidents between vehicles',
      'Does not cover non-rental vehicle damage',
      'Excludes comprehensive coverage, such as mechanical issues caused by misuse, theft, vandalism, single car accident',
      'Not for commercial use. Not compatible with cars for hire and delivery services such as Uber, Lyft, DoorDash.',
    ],
    brochureUrl: '/bonzah/bonzah-cdw-brochure.pdf',
  },
  rcli: {
    fullTitle: "Renter's Contingent Liability Insurance (RCLI)",
    description: "Covers damage to 3rd parties' property and injury when renter is at fault in accident. Does not cover rental vehicle.",
    whyBuyTitle: 'Why buy primary liability?',
    whyBuyPoints: [
      'If you have an auto policy, though prefer not to risk a premium increase in case of a liability claim up to the state minimum requirement. Or..',
      "If you don't have an auto policy and don't want to be financially responsible for injuries to persons and property up to the state minimum requirement. Or..",
      'If you normally drive a commercial vehicle, which has insurance that does not cover you for liability to other persons or property while driving a rented vehicle.',
    ],
    coverageTitle: 'Primary State Minimum Liability Insurance',
    coverageFeatures: [
      'Bodily Injury - Per Person',
      'Bodily Injury - Aggregate',
      'Property Damage',
    ],
    brochureUrl: '/bonzah/bonzah-rcli-brochure.pdf',
  },
  sli: {
    fullTitle: 'Supplemental Liability Insurance (SLI)',
    description: 'Supplements RCLI coverage to enhanced levels of coverage. Not a standalone or primary policy, must be purchased with RCLI.',
    whyBuyTitle: 'Why buy supplemental liability?',
    whyBuyPoints: [
      'If you have an auto policy with low liability coverage, and want to increase it up to an aggregate of $500,000. Or..',
      'If you have selected the above primary liability insurance (RCLI), and want to increase your coverage beyond the state minimum for injuries to persons and property up to an aggregate of $500,000.',
    ],
    coverageTitle: 'Coverage is in Excess of Any Primary Liability Coverage',
    coverageFeatures: [
      'Bodily Injury - Per Person - Up to $100,000 in total',
      'Bodily Injury - Aggregate - Up to $500,000 in total',
      'Property Damage - $10,000 additional coverage',
    ],
    brochureUrl: '/bonzah/bonzah-sli-brochure.pdf',
  },
  pai: {
    fullTitle: 'Personal Accident / Personal Effects Insurance',
    description: 'Covers life, medical expenses, and lost or damaged items. Not rental vehicle coverage.',
    whyBuyTitle: 'Why buy personal accident & effects coverage?',
    whyBuyPoints: [
      'If there is an accidental death or accidental medical expense, these insurances protect the specified losses.',
      'If you do not have death protection this coverage protects the primary Renter or Sharer and their immediate family for a death while traveling.',
      'Personal Effects Coverage protects Your personal belongings as the primary Renter or Sharer and those of Your immediate family traveling with You.',
    ],
    coverageTitle: 'Accident, Medical & Personal Effects Insurance',
    coverageFeatures: [
      'Renter Loss of Life - $50,000',
      'Passenger Loss of Life - $5,000',
      'Accidental Medical Expense - $1,000',
      'Personal Effects Coverage - $500 with up to $25 deductible will be applied',
    ],
    brochureUrl: '/bonzah/bonzah-pai-brochure.pdf',
  },
};

function InsuranceDetailModal({
  option,
  selected,
  disabled,
  onToggle,
  onClose,
}: {
  option: InsuranceOption | null;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [whyBuyOpen, setWhyBuyOpen] = useState(false);
  if (!option) return null;
  const detail = INSURANCE_DETAILS[option.id];
  if (!detail) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(12,14,12,0.55)] p-0 sm:items-center sm:p-6">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl bg-white shadow-[var(--shadow-pop)] sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-hairline bg-white px-[26px] pb-4 pt-[22px]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-[10px]">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft">
                <ShieldCheck size={15} className="text-primary" />
              </span>
              <h3 className="text-[17px] font-semibold leading-tight text-secondary">{detail.fullTitle}</h3>
            </div>
            <span onClick={onClose} className="flex-shrink-0 cursor-pointer text-muted">
              <Close size={20} strokeWidth={2} />
            </span>
          </div>
          <div className="mt-[10px] flex items-baseline gap-1">
            <span className="text-[24px] font-bold text-primary">{money(option.price)}</span>
            <span className="text-[13px] text-muted">/ 24 hours</span>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-[26px] py-5">
          <p className="text-[13.5px] leading-[1.6] text-muted">{detail.description}</p>

          <div className="overflow-hidden rounded-[10px] border border-line">
            <button
              type="button"
              onClick={() => setWhyBuyOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[13.5px] font-semibold text-primary">{detail.whyBuyTitle}</span>
              <ChevronDown size={16} className={cn('text-primary transition-transform', whyBuyOpen && 'rotate-180')} />
            </button>
            {whyBuyOpen && (
              <div className="border-t border-hairline px-4 pb-4">
                <ul className="mt-3 flex flex-col gap-3">
                  {detail.whyBuyPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-[1.55] text-muted">
                      <span className="mt-[7px] h-[5px] w-[5px] flex-shrink-0 rounded-full bg-faint" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-3 text-[13.5px] font-semibold text-ink">{detail.coverageTitle}</h4>
            <ul className="flex flex-col gap-[10px]">
              {detail.coverageFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-[10px]">
                  <span className="mt-px inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-bg-2">
                    <Check size={12} strokeWidth={3} className="text-success" />
                  </span>
                  <span className="text-[13px] leading-[1.5] text-label">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={detail.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-primary"
          >
            Description of Coverage
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6M10 14 21 3" />
            </svg>
          </a>
        </div>

        <div className="sticky bottom-0 border-t border-hairline bg-white px-[26px] py-4">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onToggle();
              onClose();
            }}
            className={cn(
              'w-full rounded-[10px] py-3 text-sm font-semibold transition-colors',
              disabled
                ? 'cursor-not-allowed bg-subtle text-faint'
                : selected
                  ? 'bg-subtle text-ink hover:bg-chip'
                  : 'bg-primary text-white hover:bg-primary-hover',
            )}
          >
            {disabled ? 'Requires RCLI' : selected ? 'Remove Coverage' : 'Add Coverage'}
          </button>
        </div>
      </div>
    </div>
  );
}
