'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_TRIP } from '@/lib/mock-data';
import {
  useFleet,
  useInsuranceOptions,
  useManualInsurancePackagesForTenant,
  useStartBookingCheckout,
  useStartEmbedBookingPayment,
  useCompanyLocations,
  useFleetUnavailableRanges,
  usePublicPaymentProviders,
  useCheckoutHoldRelease,
} from '@/hooks';
import { buildDepositConsentCopy, type SquareCardEntryHandle } from '@/components/checkout/square-card-entry';
import { useBookingInvoice } from '@/hooks/useBookingInvoice';
import { useDefaultTaxProfile } from '@/hooks/useTaxProfiles';
import { useBookingVerificationPolicy, useStartVerificationFirstBooking } from '@/hooks/useBookingPolicy';
import { getBookingVerificationPolicy } from '@/services/bookingPolicyServices';
import { squareCreatePaymentForPending } from '@/services/squarePaymentServices';
import { useDefaultLocation } from '@/contexts';
import { checkFleetAvailability, validatePromoCode } from '@/services/bookingServices';
import type { InsuranceOption } from '@/services/bookingServices';
import { toUtcIso } from '@/utils/datetime';
import { todayISO } from '@/lib/time-slots';
import { rentalDays } from '@/lib/utils';
import { buildUnavailabilityIndex, slotsBlockedOn, firstBlockInSpan } from '@/lib/unavailable-slots';
import { formatInTimeZone } from 'date-fns-tz';
import { useEmbedBridge } from '@/hooks';
import { useTenant } from '@/lib/tenant-context';
import { useDefaultAgreementTemplate } from '@/hooks/useAgreements';
import { useAbiQuote } from '@/hooks/useAbi';
import type { AbiQuoteAvailable } from '@/services/abiServices';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { pickDefaultLocation } from '@/lib/locations';
import { extractApiErrorMessage } from './fleet-detail-shared';
import { trackVehicleView, trackBeginCheckout } from '@/lib/tracking-events';

export const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

export type Fields = { firstName: string; lastName: string; email: string; phone: string; license: string };

/** All fleet-detail/booking-checkout data, state, and handlers —
 *  shared verbatim by both templates' fleet detail pages so this
 *  revenue-critical logic lives in exactly one place. Templates differ
 *  only in how they render what this returns. This is a pure
 *  mechanical extraction of what used to be inline in page.tsx —
 *  nothing about the logic itself has changed. */
export function useFleetDetail(carId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embed = useEmbedBridge();
  const squareCardRef = useRef<SquareCardEntryHandle | null>(null);
  const [squareCardError, setSquareCardError] = useState<string | null>(null);
  const tenant = useTenant();
  const { t } = useDynamicTranslation([
    'First name',
    'Last name',
    'Email address',
    'Phone number',
    'Remove promo code',
    'Enter promo code',
    'Close',
    'Pick-up',
    'Return',
  ]);

  const { data: manualInsurancePackages } = useManualInsurancePackagesForTenant();
  const { data: companyLocations } = useCompanyLocations();
  const defaultLoc = useDefaultLocation();
  const startCheckout = useStartBookingCheckout();
  const startEmbedPayment = useStartEmbedBookingPayment();
  const { registerHold, suppressRelease, releaseNow } = useCheckoutHoldRelease(carId);
  // Single-provider policy: the tenant admin enables exactly one
  // gateway at a time on the Integrations page — customer-central
  // just uses whatever's on. No picker, no per-request override.
  const { data: providersData } = usePublicPaymentProviders();
  const activeProvider: 'stripe' | 'square' =
    (providersData?.providers?.[0] as 'stripe' | 'square') ?? 'stripe';
  const [embedIntent, setEmbedIntent] = useState<null | {
    provider: 'stripe' | 'square';
    clientSecret: string;
    publishableKey: string;
    stripeAccountId: string;
    providerExtra: Record<string, string | number | boolean | null>;
    amount: string;
    currency: string;
    pendingId: string;
  }>(null);
  const paymentAnchorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (embedIntent) {
      // Give the panel a moment to mount + the Web Payments SDK to
      // render its iframe before scrolling — otherwise we scroll to
      // an empty slot and the card entry pops in below the fold.
      const t = setTimeout(() => {
        paymentAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [embedIntent]);
  const { data: verificationPolicy } = useBookingVerificationPolicy();
  const startVerification = useStartVerificationFirstBooking();
  const { data: defaultTaxProfile } = useDefaultTaxProfile();
  const protectionRef = useRef<HTMLHeadingElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [selectedInsurance, setSelectedInsurance] = useState<Set<string>>(new Set());
  const [selectedManualIds, setSelectedManualIds] = useState<Set<number>>(new Set());
  const [abiOptedIn, setAbiOptedIn] = useState(false);
  useEffect(() => {
    const mandatoryIds = (manualInsurancePackages ?? [])
      .filter((p) => p.isMandatory)
      .map((p) => p.id);
    if (mandatoryIds.length === 0) return;
    setSelectedManualIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of mandatoryIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [manualInsurancePackages]);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoAppliesTo, setPromoAppliesTo] = useState<string[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [fields, setFields] = useState<Fields>({ firstName: '', lastName: '', email: '', phone: '', license: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [checkoutError, setCheckoutError] = useState('');
  const [rentalAgreementSignature, setRentalAgreementSignature] = useState<string | null>(null);
  const [rentalAgreementModalOpen, setRentalAgreementModalOpen] = useState(false);
  const { data: rentalAgreementTemplate } = useDefaultAgreementTemplate();
  const rentalAgreementRequired = (rentalAgreementTemplate?.clauses?.length ?? 0) > 0;
  const rentalAgreementSigned = !!rentalAgreementSignature;

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tripOpen, setTripOpen] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);
  const [openLocDropdown, setOpenLocDropdown] = useState<'pickup' | 'dropoff' | null>(null);
  const urlPickupLoc = searchParams.get('pickupLocId');
  const urlDropoffLoc = searchParams.get('dropoffLocId');
  const urlPickupDate = searchParams.get('pickupDate');
  const urlPickupTime = searchParams.get('pickupTime');
  const urlReturnDate = searchParams.get('returnDate');
  const urlReturnTime = searchParams.get('returnTime');
  const [pickupLocId, setPickupLocId] = useState<string | null>(urlPickupLoc);
  const [dropoffLocId, setDropoffLocId] = useState<string | null>(urlDropoffLoc);
  const [pickupDate, setPickupDate] = useState(urlPickupDate ?? DEFAULT_TRIP.pickupDate);
  const [pickupTime, setPickupTime] = useState(urlPickupTime ?? DEFAULT_TRIP.pickupTime);
  const [returnDate, setReturnDate] = useState(urlReturnDate ?? DEFAULT_TRIP.returnDate);
  const [returnTime, setReturnTime] = useState(urlReturnTime ?? DEFAULT_TRIP.returnTime);

  // Persist form fields to sessionStorage so a reload (or a widget parent
  // reload that remounts the iframe) doesn't wipe what the customer just
  // typed. sessionStorage is per-origin — same origin as this page — so
  // it survives across iframe remounts.
  const persistKey = `fhq-checkout-form:${carId}`;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(persistKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        fields?: Fields;
        selectedInsurance?: string[];
        extras?: Record<string, number>;
        promoCode?: string;
        promoInput?: string;
        abiOptedIn?: boolean;
      };
      if (saved.fields) setFields(saved.fields);
      if (Array.isArray(saved.selectedInsurance)) setSelectedInsurance(new Set(saved.selectedInsurance));
      if (saved.extras) setExtras(saved.extras);
      if (saved.promoCode) setPromoCode(saved.promoCode);
      if (saved.promoInput) setPromoInput(saved.promoInput);
      if (typeof saved.abiOptedIn === 'boolean') setAbiOptedIn(saved.abiOptedIn);
    } catch {
      /* corrupt entry — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        persistKey,
        JSON.stringify({
          fields,
          selectedInsurance: Array.from(selectedInsurance),
          extras,
          promoCode,
          promoInput,
          abiOptedIn,
        }),
      );
    } catch {
      /* quota / private mode — silently drop */
    }
  }, [persistKey, fields, selectedInsurance, extras, promoCode, promoInput, abiOptedIn]);

  const fleetTz = useMemo(() => {
    const fromLoc = companyLocations?.find((l) => String(l.id) === pickupLocId)?.timezone;
    return fromLoc ?? defaultLoc?.timezone ?? null;
  }, [companyLocations, pickupLocId, defaultLoc]);

  const fleetDateArgs = useMemo(() => {
    if (!fleetTz) return undefined;
    return {
      pickupDatetime: toUtcIso(pickupDate, pickupTime, fleetTz),
      dropoffDatetime: toUtcIso(returnDate, returnTime, fleetTz),
    };
  }, [fleetTz, pickupDate, pickupTime, returnDate, returnTime]);

  const { data: vehicle, isLoading } = useFleet(carId, true, fleetDateArgs);

  // Fire once per vehicle, not per render — price and availability
  // refetch as the trip dates change, which would otherwise re-fire
  // ViewContent repeatedly for the same car.
  useEffect(() => {
    if (!vehicle) return;
    trackVehicleView({
      id: vehicle.id,
      name: vehicle.name,
      pricePerDay: vehicle.pricePerDay,
      vehicleType: vehicle.vehicleType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);


  // Keyed off the resolved fleet's numeric id, not the URL param —
  // that param is the vehicle's slug, and the unavailable-ranges
  // endpoint filters on the integer pk.
  const { data: unavailableRanges = [] } = useFleetUnavailableRanges(vehicle?.id);
  const unavailabilityIndex = useMemo(
    () => buildUnavailabilityIndex(unavailableRanges, fleetTz),
    [unavailableRanges, fleetTz],
  );
  const unavailableDates = unavailabilityIndex.fullyBlockedDates;
  const { data: insuranceOptions, isLoading: insuranceOptionsLoading } =
    useInsuranceOptions(fleetDateArgs);

  const { data: abiQuote } = useAbiQuote({
    fleetId: vehicle?.id,
    startDate: pickupDate ? pickupDate.slice(0, 10) : undefined,
    endDate: returnDate ? returnDate.slice(0, 10) : undefined,
  });
  const abiAvailable: AbiQuoteAvailable | null =
    abiQuote && abiQuote.available === true ? (abiQuote as AbiQuoteAvailable) : null;
  const abiPremium = abiAvailable && abiOptedIn ? Number(abiAvailable.total_price) : 0;

  useEffect(() => {
    if (pickupLocId || !companyLocations?.length) return;
    const pickupLocs = companyLocations.filter((l) => l.type === 'pickup' || l.type === 'both');
    const dropoffLocs = companyLocations.filter((l) => l.type === 'dropoff' || l.type === 'both');
    const def =
      pickDefaultLocation(pickupLocs, defaultLoc?.id) ?? companyLocations[0];
    setPickupLocId(String(def.id));
    const dropDef = pickDefaultLocation(dropoffLocs, def.id) ?? def;
    setDropoffLocId(String(dropDef.id));
  }, [companyLocations, defaultLoc, pickupLocId]);

  const days = rentalDays(pickupDate, returnDate, pickupTime, returnTime);
  const rentalHours = useMemo(() => {
    const pickupMs = new Date(`${pickupDate}T${pickupTime || '00:00'}:00`).getTime();
    const dropoffMs = new Date(`${returnDate}T${returnTime || '00:00'}:00`).getTime();
    if (Number.isNaN(pickupMs) || Number.isNaN(dropoffMs)) return Math.max(1, days * 24);
    return Math.max(1, Math.ceil((dropoffMs - pickupMs) / 3600000));
  }, [pickupDate, pickupTime, returnDate, returnTime, days]);

  const minDuration = vehicle?.minDuration ?? 1;
  const isHourlyFleet = (vehicle?.pricePerHour ?? 0) > 0;
  const rawRentalHours = useMemo(() => {
    const pickupMs = new Date(`${pickupDate}T${pickupTime || '00:00'}:00`).getTime();
    const dropoffMs = new Date(`${returnDate}T${returnTime || '00:00'}:00`).getTime();
    if (Number.isNaN(pickupMs) || Number.isNaN(dropoffMs)) return days * 24;
    return (dropoffMs - pickupMs) / 3600000;
  }, [pickupDate, pickupTime, returnDate, returnTime, days]);
  const meetsMinDuration = isHourlyFleet
    ? rawRentalHours >= 1
    : minDuration > 1
      ? rawRentalHours >= minDuration * 24
      : days >= minDuration;

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

  const selectedManualPackages = useMemo(() => {
    const list = manualInsurancePackages ?? [];
    return list.filter((p) => selectedManualIds.has(p.id));
  }, [manualInsurancePackages, selectedManualIds]);

  const { pricing, extraInvoiceItems, extrasById, insuranceLabel } = useBookingInvoice({
    vehicleData,
    rentalDays: days,
    rentalHours,
    pickupDate,
    dropoffDate: returnDate,
    selectedInsurance,
    insuranceOptions: insuranceOptions ?? [],
    selectedManualPackages,
    selectedExtras,
    companyLocations: companyLocations ?? [],
    pickupLocationId: pickupLocId,
    dropoffLocationId: dropoffLocId,
    appliedDiscount: promoApplied ? promoDiscount : 0,
    discountCode: promoApplied ? promoCode : undefined,
    defaultTaxProfile,
  });

  useEffect(() => {
    if (!checkoutError) return;
    errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [checkoutError]);

  useEffect(() => {
    if (!promoApplied || !promoCode) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await validatePromoCode({
          code: promoCode,
          base_price: pricing.subtotal - pricing.insuranceCost - pricing.extrasCost,
          extras_price: pricing.insuranceCost + pricing.extrasCost,
          extras_by_id: extrasById,
          fees: pricing.bookingFee,
          location_charges: pricing.locationCharges,
        });
        if (cancelled) return;
        if (result.valid && result.discount_amount) {
          setPromoDiscount(parseFloat(result.discount_amount));
          setPromoAppliesTo(result.applies_to ?? []);
        } else {
          setPromoApplied(false);
          setPromoCode('');
          setPromoDiscount(0);
          setPromoAppliesTo([]);
          setPromoError(result.error || 'Promo no longer valid');
        }
      } catch {
        if (cancelled) return;
        setPromoApplied(false);
        setPromoCode('');
        setPromoDiscount(0);
        setPromoAppliesTo([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    promoApplied,
    promoCode,
    pricing.subtotal,
    pricing.insuranceCost,
    pricing.extrasCost,
    pricing.bookingFee,
    pricing.locationCharges,
    extrasById,
  ]);

  const common = {
    router,
    searchParams,
    embed,
    squareCardRef,
    squareCardError,
    setSquareCardError,
    tenant,
    t,
    manualInsurancePackages,
    companyLocations,
    defaultLoc,
    startCheckout,
    startEmbedPayment,
    registerHold,
    suppressRelease,
    releaseNow,
    providersData,
    activeProvider,
    embedIntent,
    setEmbedIntent,
    paymentAnchorRef,
    verificationPolicy,
    startVerification,
    defaultTaxProfile,
    protectionRef,
    errorBannerRef,
    selectedInsurance,
    setSelectedInsurance,
    selectedManualIds,
    setSelectedManualIds,
    abiOptedIn,
    setAbiOptedIn,
    extras,
    setExtras,
    promoApplied,
    setPromoApplied,
    promoCode,
    setPromoCode,
    promoDiscount,
    setPromoDiscount,
    promoAppliesTo,
    promoInput,
    setPromoInput,
    promoError,
    setPromoError,
    fields,
    setFields,
    errors,
    setErrors,
    checkoutError,
    setCheckoutError,
    rentalAgreementSignature,
    setRentalAgreementSignature,
    rentalAgreementModalOpen,
    setRentalAgreementModalOpen,
    rentalAgreementRequired,
    rentalAgreementSigned,
    galleryOpen,
    setGalleryOpen,
    galleryIndex,
    setGalleryIndex,
    detailId,
    setDetailId,
    tripOpen,
    setTripOpen,
    tripError,
    setTripError,
    openLocDropdown,
    setOpenLocDropdown,
    pickupLocId,
    setPickupLocId,
    dropoffLocId,
    setDropoffLocId,
    pickupDate,
    setPickupDate,
    pickupTime,
    setPickupTime,
    returnDate,
    setReturnDate,
    returnTime,
    setReturnTime,
    persistKey,
    fleetTz,
    unavailableRanges,
    unavailabilityIndex,
    unavailableDates,
    insuranceOptions,
    abiQuote,
    abiAvailable,
    abiPremium,
    days,
    rentalHours,
    minDuration,
    isHourlyFleet,
    meetsMinDuration,
    carId,
  };

  if (isLoading || insuranceOptionsLoading) {
    return { status: 'loading' as const, isLoading, insuranceOptionsLoading };
  }

  if (!vehicle) {
    return { status: 'not-found' as const };
  }

  const plans: InsuranceOption[] = insuranceOptions ?? [];
  const recommendedPlanId = (plans.find((p) => p.price > 0) ?? plans[0])?.id ?? null;
  const selectedPlans = plans.filter((p) => selectedInsurance.has(p.id) && p.id !== 'own');
  const ownSelected = selectedInsurance.has('own');

  const galleryImages = vehicle.images.length > 0 ? vehicle.images : ['/images/vehicles/car_placeholder.svg'];

  const discount = pricing.discount;
  const total = pricing.total + abiPremium;

  const isInsuranceDisabled = (id: string) => id === 'sli' && !selectedInsurance.has('rcli');
  const clearOwnInsurance = () =>
    setSelectedInsurance((prev) => {
      if (!prev.has('own')) return prev;
      const next = new Set(prev);
      next.delete('own');
      return next;
    });
  // Invariant: 'own' (renter brings external insurance) is mutually
  // exclusive with every real coverage source — Bonzah tiers, ABI, and
  // manual packages. Turning 'own' ON clears every real source below;
  // turning any real source ON clears 'own' (handled here for Bonzah,
  // in handleToggleAbi/handleToggleManual for the other two).
  const toggleInsurance = (id: string) => {
    if (id === 'own') {
      const turningOn = !selectedInsurance.has('own');
      setSelectedInsurance(turningOn ? new Set(['own']) : new Set());
      if (turningOn) {
        setAbiOptedIn(false);
        setSelectedManualIds((prev) => (prev.size ? new Set() : prev));
      }
      return;
    }
    setSelectedInsurance((prev) => {
      const next = new Set(prev);
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
  const handleToggleAbi = (opted: boolean) => {
    if (opted) clearOwnInsurance();
    setAbiOptedIn(opted);
  };
  const handleToggleManual = (id: number) => {
    setSelectedManualIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        clearOwnInsurance();
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
    if (!f.firstName.trim()) e.firstName = 'First name is required';
    if (!f.lastName.trim()) e.lastName = 'Last name is required';
    if (!f.email) e.email = 'Email address is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'Enter a valid email address';
    if (!f.phone) e.phone = 'Phone number is required';
    else if (f.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
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

    const tzPickup = companyLocations?.find((l) => String(l.id) === pickupLocId)?.timezone ?? null;
    const tz = tzPickup ?? defaultLoc?.timezone ?? null;
    if (!tz) {
      setCheckoutError("Couldn't determine the rental location's timezone, please refresh.");
      return;
    }

    const toIso = (d: string, t: string) => toUtcIso(d, t, tz);
    const pickupDatetime = toIso(pickupDate, pickupTime);
    const dropoffDatetime = toIso(returnDate, returnTime);

    const conflict = firstBlockInSpan(
      unavailableRanges,
      new Date(pickupDatetime).getTime(),
      new Date(dropoffDatetime).getTime(),
    );
    if (conflict) {
      const when = formatInTimeZone(new Date(conflict.start), tz, 'MMM d, h:mm a');
      setCheckoutError(
        `Part of your selected time isn't available — this vehicle is already booked or blocked from ${when}. Please adjust your pickup/drop-off times or dates.`,
      );
      return;
    }

    const isAvailable = await checkFleetAvailability(vehicle.id, pickupDatetime, dropoffDatetime);
    if (!isAvailable) {
      setCheckoutError('That time was just taken for this vehicle. Please pick a different time or date.');
      return;
    }

    // Past validation, conflicts and the live availability re-check, so
    // this reflects a booking actually proceeding rather than a failed
    // submit attempt.
    trackBeginCheckout({
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        pricePerDay: vehicle.pricePerDay,
        vehicleType: vehicle.vehicleType,
      },
      value: total,
      days,
    });

    const pickupLocationId = Number(pickupLocId ?? defaultLoc?.id ?? 0);
    const dropoffLocationId = Number(dropoffLocId ?? pickupLocId ?? defaultLoc?.id ?? 0);
    const firstName = fields.firstName.trim();
    const lastName = fields.lastName.trim();
    const licenseNo = fields.license.trim();
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

    const manualIds = Array.from(selectedManualIds);

    if (rentalAgreementRequired && !rentalAgreementSignature) {
      setCheckoutError('Please review and sign the rental agreement before continuing.');
      setRentalAgreementModalOpen(true);
      return;
    }

    const signaturePayload = rentalAgreementSignature
      ? { signature_image: rentalAgreementSignature }
      : {};

    if (freshPolicyMode === 'before') {
      const sharedPayload = {
        first_name: firstName,
        last_name: lastName,
        email: fields.email.trim(),
        phone: fields.phone.trim().slice(0, 15),
        license_no: licenseNo,
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
        ...(manualIds.length > 0 ? { manual_insurance_package_ids: manualIds } : {}),
        extras: activeExtraItems.length > 0 ? activeExtraItems : [],
        fuel_pre_purchase: false,
        return_car_to_different_branch: false,
        additional_drivers: 0,
        notes: '',
        abi_coverage: !!abiAvailable && abiOptedIn,
        ...(promoApplied && promoCode ? { promo_code: promoCode } : {}),
        ...signaturePayload,
      };
      startVerification.mutate(sharedPayload as Record<string, unknown>, {
        onSuccess: (data) => {
          if (embed.embedded) embed.reportBookingComplete(data.booking_id);
          try { window.sessionStorage.removeItem(persistKey); } catch { /* ignore */ }
          window.location.href = `/booking/${data.booking_id}?token=${encodeURIComponent(data.access_token)}`;
        },
        onError: (error: unknown) => {
          setCheckoutError(
            extractApiErrorMessage(error, 'Could not start verification. Please try again.'),
          );
        },
      });
      return;
    }

    const commonPayload = {
      fleet_id: Number(vehicle.id),
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: fields.email.trim(),
        phone_no: fields.phone.trim().slice(0, 15),
        license_no: licenseNo,
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
      ...(manualIds.length > 0 ? { manual_insurance_package_ids: manualIds } : {}),
      extras: activeExtraItems.length > 0 ? activeExtraItems : undefined,
      abi_coverage: !!abiAvailable && abiOptedIn,
      ...(promoApplied && promoCode ? { promo_code: promoCode } : {}),
      ...signaturePayload,
    };

    // Square uses the always-visible inline card entry — tokenize the
    // card the user already filled in, THEN create the pending row +
    // charge. Stripe/embed path keeps the two-step "reserve → panel"
    // flow because Stripe Elements needs a client_secret from a
    // pre-created PaymentIntent to render its PaymentElement.
    if (!embed.embedded && activeProvider === 'square') {
      const deposit = Number((vehicle as any)?.securityDeposit) || 0;
      if (!squareCardRef.current || !squareCardRef.current.isReady()) {
        setCheckoutError('Card entry is still loading — please wait a moment and try again.');
        return;
      }
      if (deposit > 0 && !squareCardRef.current.consentChecked()) {
        setCheckoutError('Please agree to the security deposit to continue.');
        return;
      }
      const tokens = await squareCardRef.current.tokenize({ withSaveCard: deposit > 0 });
      if (!tokens) {
        // SquareCardEntry set the error via onError → surface it as
        // the checkout error too so it lands in the banner.
        setCheckoutError(squareCardError || 'Please check your card details and try again.');
        return;
      }
      try {
        const data = await startEmbedPayment.mutateAsync({ payload: commonPayload });
        registerHold(data.pending_id);
        try { window.sessionStorage.removeItem(persistKey); } catch { /* ignore */ }
        const consentCopy = buildDepositConsentCopy({
          tenantName: tenant?.name,
          amount: deposit,
          currency: data.currency,
        });
        const body = await squareCreatePaymentForPending({
          pendingId: data.pending_id,
          sourceId: tokens.paymentSourceId,
          amount: data.amount,
          currency: data.currency,
          returnUrl: `${origin}/booking/success?session_id=${data.pending_id}`,
          deposit: tokens.saveCardSourceId
            ? { saveCardSourceId: tokens.saveCardSourceId, consentCopy }
            : null,
        });
        suppressRelease({ clear: true });
        if (body.booking_id && body.access_token) {
          window.location.href = `/booking/${body.booking_id}?token=${encodeURIComponent(body.access_token)}`;
          return;
        }
        window.location.href = `/booking/success?session_id=${encodeURIComponent(data.pending_id)}`;
      } catch (error) {
        setCheckoutError(
          extractApiErrorMessage(error, 'We couldn’t start checkout. Please check your details and try again.'),
        );
      }
      return;
    }

    // Widget-embed path (iframe hosts still use the two-step reveal).
    if (embed.embedded) {
      try {
        const data = await startEmbedPayment.mutateAsync({ payload: commonPayload });
        registerHold(data.pending_id);
        try { window.sessionStorage.removeItem(persistKey); } catch { /* ignore */ }
        setEmbedIntent({
          provider: (data.provider as 'stripe' | 'square') || 'stripe',
          clientSecret: data.client_secret,
          publishableKey: data.publishable_key,
          stripeAccountId:
            (data as any).provider_account_id || data.stripe_account_id,
          providerExtra: (data as any).provider_extra || {},
          amount: data.amount,
          currency: data.currency,
          pendingId: data.pending_id,
        });
      } catch (error) {
        setCheckoutError(
          extractApiErrorMessage(error, 'We couldn’t start checkout. Please check your details and try again.'),
        );
      }
      return;
    }

    try {
      const data = await startCheckout.mutateAsync({
        ...commonPayload,
        success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/fleet/${carId}`,
      });
      registerHold(data.pending_id);
      try { window.sessionStorage.removeItem(persistKey); } catch { /* ignore */ }
      suppressRelease();
      window.location.href = data.checkout_url;
    } catch (error) {
      setCheckoutError(
        extractApiErrorMessage(error, 'We couldn’t start checkout. Please check your details and try again.'),
      );
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
        extras_by_id: extrasById,
        fees: pricing.bookingFee,
        location_charges: pricing.locationCharges,
      });
      if (result.valid && result.discount_amount) {
        setPromoApplied(true);
        setPromoCode(c);
        setPromoDiscount(parseFloat(result.discount_amount));
        setPromoAppliesTo(result.applies_to ?? []);
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
  const dropoffMinTime = selectedDropoff && !selectedDropoff.is247 ? selectedDropoff.openingTime : null;
  const dropoffMaxTime = selectedDropoff && !selectedDropoff.is247 ? selectedDropoff.closingTime : null;

  return {
    status: 'ready' as const,
    ...common,
    vehicle,
    plans,
    recommendedPlanId,
    selectedPlans,
    selectedManualPackages,
    ownSelected,
    galleryImages,
    discount,
    total,
    isInsuranceDisabled,
    clearOwnInsurance,
    toggleInsurance,
    handleToggleAbi,
    handleToggleManual,
    gallery,
    photoCount,
    setField,
    blurField,
    setExtra,
    handlePickupDate,
    validate,
    reserve,
    applyPromo,
    scrollProtection,
    hasErrors,
    locs,
    pickupLocations,
    dropoffLocations,
    selectedPickup,
    selectedDropoff,
    pickupCity,
    dropoffCity,
    minTime,
    maxTime,
    dropoffMinTime,
    dropoffMaxTime,
    pricing,
    extraInvoiceItems,
    insuranceLabel,
    todayISO,
    slotsBlockedOn,
  };
}
