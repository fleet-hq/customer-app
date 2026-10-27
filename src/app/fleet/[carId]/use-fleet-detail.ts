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
  useActivePaymentProvider,
  useCheckoutHoldRelease,
} from '@/hooks';
import { nmiCreatePaymentForPending } from '@/services/nmiPaymentServices';
import { useBookingInvoice } from '@/hooks/useBookingInvoice';
import { useBookingVerificationPolicy, useStartVerificationFirstBooking } from '@/hooks/useBookingPolicy';
import { getBookingVerificationPolicy } from '@/services/bookingPolicyServices';
import { useDefaultLocation } from '@/contexts';
import { checkFleetAvailability, checkoutBody, validatePromoCode } from '@/services/bookingServices';
import type { InsuranceOption, QuotePayload } from '@/services/bookingServices';
import { toUtcIso } from '@/utils/datetime';
import { todayISO } from '@/lib/time-slots';
import { rentalDays } from '@/lib/utils';
import { buildUnavailabilityIndex, slotsBlockedOn, firstBlockInSpan } from '@/lib/unavailable-slots';
import { formatInTimeZone } from 'date-fns-tz';
import { useEmbedBridge } from '@/hooks';
import { useTenant } from '@/lib/tenant-context';
import { useDefaultAgreementTemplate, useCompanySettings, useBonzahAddendum } from '@/hooks/useAgreements';
import { useBookingAgreementData } from '@/components/booking/use-booking-agreement-data';
import { useAbiQuote } from '@/hooks/useAbi';
import type { AbiQuoteAvailable } from '@/services/abiServices';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { pickDefaultLocation } from '@/lib/locations';
import { extractApiErrorMessage } from './fleet-detail-shared';
import { useRentalSiteConfig } from '@/hooks/useRentalSiteConfig';
import { rateCard } from '@/lib/rate-card';
import { trackedPromo } from '@/lib/tracking-tag';
import { weeklyDepositTiming } from '@/lib/price-rows';
import { useOngoingQuote } from '@/hooks/useRentalSiteConfig';
import type { OngoingOffer, OngoingQuotePayload, RentalModel } from '@/services/rentalServices';

type OngoingModel = Exclude<RentalModel, 'daily'>;
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
  const [nmiPay, setNmiPay] = useState<null | {
    pendingId: string;
    amount: number;
    currency: string;
    deposit: number;
  }>(null);
  const [nmiSubmitting, setNmiSubmitting] = useState(false);
  const reserveLock = useRef(false);
  const [reserving, setReserving] = useState(false);
  const [nmiCardError, setNmiCardError] = useState<string | null>(null);
  const { registerHold, suppressRelease, releaseNow } = useCheckoutHoldRelease(carId);
  // Single-provider policy: the tenant admin enables exactly one
  // gateway at a time on the Integrations page — customer-central
  // just uses whatever's on. No picker, no per-request override.
  const { data: providersData } = usePublicPaymentProviders();
  const activeProvider = useActivePaymentProvider();
  const nmiConfig = (providersData as { nmi?: { publishable_key?: string } } | undefined)?.nmi;
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
  // E8.6: website checkouts are created with setup_future_usage=off_session,
  // so every one of them leaves a reusable card behind. The renter has to
  // authorize that before they can pay.
  const [cardConsent, setCardConsent] = useState(false);
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
  const rentalConfig = useRentalSiteConfig();

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

  const minDuration = vehicle?.minDuration ?? 1;
  const isHourlyFleet = (vehicle?.pricePerHour ?? 0) > 0;
  const rawRentalHours = useMemo(() => {
    const pickupMs = fleetTz
      ? Date.parse(toUtcIso(pickupDate, pickupTime || '00:00', fleetTz))
      : new Date(`${pickupDate}T${pickupTime || '00:00'}:00`).getTime();
    const dropoffMs = fleetTz
      ? Date.parse(toUtcIso(returnDate, returnTime || '00:00', fleetTz))
      : new Date(`${returnDate}T${returnTime || '00:00'}:00`).getTime();
    if (Number.isNaN(pickupMs) || Number.isNaN(dropoffMs)) return days * 24;
    return (dropoffMs - pickupMs) / 3600000;
  }, [pickupDate, pickupTime, returnDate, returnTime, days, fleetTz]);
  // Mirrors bookings/duration.py on the server. With the operator's
  // short-trip allowance the question is what the renter is billed —
  // `days` already rounds part-days up the way the invoice does — so a
  // trip that reaches the minimum on price is accepted even though it
  // falls short on the clock.
  const allowShortAtMin = vehicle?.allowShortTripsAtMinimum ?? false;
  const minHours = vehicle?.minHours ?? 1;
  const meetsMinDuration = isHourlyFleet
    ? rawRentalHours >= minHours
    : allowShortAtMin
      ? days >= minDuration
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
            discounts: vehicle.discounts,
            image: vehicle.images?.[0] ?? PLACEHOLDER_IMAGE,
            name: vehicle.name,
            licensePlate: vehicle.licensePlate,
            extras: vehicle.extras ?? [],
          }
        : null,
    [vehicle],
  );

  const quotePayload = useMemo<QuotePayload | null>(() => {
    if (!vehicle || !fleetDateArgs) return null;
    const manualIds = Array.from(selectedManualIds);
    const activeExtraItems = (vehicle.extras ?? [])
      .filter((x) => (extras[x.id] || 0) > 0)
      .map((x) => ({ id: Number(x.id), quantity: extras[x.id] }))
      .filter((x) => !Number.isNaN(x.id));
    return {
      fleet_id: Number(vehicle.id),
      pickup_datetime: fleetDateArgs.pickupDatetime,
      dropoff_datetime: fleetDateArgs.dropoffDatetime,
      pickup_location_id: Number(pickupLocId ?? defaultLoc?.id ?? 0),
      dropoff_location_id: Number(dropoffLocId ?? pickupLocId ?? defaultLoc?.id ?? 0),
      insurance_selected: !selectedInsurance.has('own') && selectedInsurance.size > 0,
      cdw_cover: selectedInsurance.has('cdw'),
      rcli_cover: selectedInsurance.has('rcli'),
      sli_cover: selectedInsurance.has('sli'),
      pai_cover: selectedInsurance.has('pai'),
      ...(manualIds.length > 0 ? { manual_insurance_package_ids: manualIds } : {}),
      extras: activeExtraItems.length > 0 ? activeExtraItems : undefined,
      abi_coverage: !!abiAvailable && abiOptedIn,
      ...(promoApplied && promoCode ? { promo_code: promoCode } : {}),
    };
  }, [
    vehicle,
    fleetDateArgs,
    pickupLocId,
    dropoffLocId,
    defaultLoc?.id,
    extras,
    selectedInsurance,
    selectedManualIds,
    abiAvailable,
    abiOptedIn,
    promoApplied,
    promoCode,
  ]);

  const selectedManualPackages = useMemo(() => {
    const list = manualInsurancePackages ?? [];
    return list.filter((p) => selectedManualIds.has(p.id));
  }, [manualInsurancePackages, selectedManualIds]);

  const ongoingOptions = useMemo<OngoingModel[]>(() => {
    if (!vehicle || !rentalConfig.website_ongoing) return [];
    const out: OngoingModel[] = [];
    if (vehicle.offersGig && vehicle.pricePerWeek > 0 && rentalConfig.models.includes('gig')) out.push('gig');
    if (
      vehicle.offersSubscription &&
      rentalConfig.models.includes('subscription') &&
      rentalConfig.plans.some((plan) => plan.id === vehicle.subscriptionPlanId)
    ) {
      out.push('subscription');
    }
    return out;
  }, [vehicle, rentalConfig]);
  const urlModel = searchParams.get('model') as OngoingModel | null;
  const ongoingModel = ongoingOptions.find((m) => m === urlModel) ?? ongoingOptions[0] ?? null;
  const dailyAllowed = !vehicle || (vehicle.offersDaily && rentalConfig.models.includes('daily'));
  const [weeklyChosen, setWeekly] = useState(urlModel === 'gig' || urlModel === 'subscription');
  const [weeklyConsent, setWeeklyConsent] = useState(false);
  const planId = ongoingModel === 'subscription' ? vehicle?.subscriptionPlanId ?? null : null;

  const ongoingPayload = useMemo<OngoingQuotePayload | null>(() => {
    if (!ongoingModel || !quotePayload) return null;
    return {
      fleet_id: quotePayload.fleet_id,
      rental_model: ongoingModel,
      subscription_plan_id: planId,
      pickup_datetime: quotePayload.pickup_datetime,
      pickup_location_id: quotePayload.pickup_location_id,
      extras: quotePayload.extras,
    };
  }, [ongoingModel, planId, quotePayload]);
  const { quote: ongoingQuote, stale: ongoingStale } = useOngoingQuote(ongoingPayload);
  const futureBooked = !!ongoingQuote && !ongoingQuote.available && ongoingQuote.code === 'future_booking';
  const hideWeekly = futureBooked && dailyAllowed;
  const weeklyOn = !!ongoingModel && !hideWeekly && (weeklyChosen || !dailyAllowed);
  const insuranceRule = weeklyOn ? null : rentalConfig.daily_insurance_mode ?? null;
  const ownOnly = insuranceRule === 'own_policy_only';
  const cdwRequired = insuranceRule === 'bonzah_cdw_required';
  useEffect(() => {
    if (ownOnly) {
      setSelectedInsurance((prev) => (prev.size === 1 && prev.has('own') ? prev : new Set(['own'])));
    } else if (cdwRequired) {
      setSelectedInsurance((prev) => {
        if (prev.has('cdw') && !prev.has('own')) return prev;
        const next = new Set(prev);
        next.delete('own');
        next.add('cdw');
        return next;
      });
    }
  }, [ownOnly, cdwRequired]);
  const offer: OngoingOffer | null = weeklyOn && ongoingQuote && ongoingQuote.available ? ongoingQuote : null;

  const bookingPayload = useMemo<QuotePayload | null>(() => {
    if (!quotePayload || !weeklyOn) return quotePayload;
    if (!offer || !ongoingModel) return null;
    return {
      fleet_id: quotePayload.fleet_id,
      pickup_datetime: quotePayload.pickup_datetime,
      dropoff_datetime: offer.first_period_end,
      pickup_location_id: quotePayload.pickup_location_id,
      dropoff_location_id: quotePayload.pickup_location_id,
      insurance_selected: false,
      cdw_cover: false,
      rcli_cover: false,
      sli_cover: false,
      pai_cover: false,
      extras: quotePayload.extras,
      abi_coverage: false,
      rental_model: ongoingModel,
      subscription_plan_id: planId,
      weekly_consent: weeklyConsent,
    };
  }, [quotePayload, weeklyOn, offer, ongoingModel, planId, weeklyConsent]);

  const bonzahSelected = useMemo(
    () => Array.from(selectedInsurance).some((id) => id !== 'own'),
    [selectedInsurance],
  );

  const { pricing, extraInvoiceItems, extrasById, insuranceLabel, quoteError } = useBookingInvoice({
    quotePayload: weeklyOn ? null : quotePayload,
    vehicleData,
    selectedInsurance,
    selectedExtras,
    appliedDiscount: promoApplied ? promoDiscount : 0,
  });
  const tripProblem = !weeklyOn && meetsMinDuration ? quoteError : null;

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

  const applyCode = async (raw: string) => {
    const c = raw.trim().toUpperCase();
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

  const [trackedPromoTried, setTrackedPromoTried] = useState(false);
  useEffect(() => {
    if (trackedPromoTried || promoApplied || pricing.stale || pricing.total <= 0) return;
    setTrackedPromoTried(true);
    const tracked = trackedPromo();
    if (tracked) applyCode(tracked);
  }, [trackedPromoTried, promoApplied, pricing.stale, pricing.total]);

  const { data: companySettings } = useCompanySettings();
  const { data: bonzahAddendumData } = useBonzahAddendum();

  // The agreement exactly as it will read once booked, so the customer
  // reviews the real document before signing rather than clauses alone.
  const agreementPreviewData = useBookingAgreementData({
    vehicle,
    pricing,
    selectedExtras: extras,
    customer: fields,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    pickupIso: fleetDateArgs?.pickupDatetime,
    dropoffIso: fleetDateArgs?.dropoffDatetime,
    company: companySettings,
    tenantName: tenant.name,
    template: rentalAgreementTemplate,
    addendum: bonzahSelected ? bonzahAddendumData ?? null : null,
    timezone: fleetTz,
    insuranceLabel,
    ownInsurance: selectedInsurance.has('own'),
    signature: rentalAgreementSignature,
    ongoingTerms: weeklyOn ? offer?.agreement ?? null : null,
  });

  const common = {
    agreementPreviewData,
    router,
    searchParams,
    embed,
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
    nmiConfig,
    nmiPay,
    closeNmiPay: () => {
      // Backing out of the window abandons the reservation it was
      // opened against, so hand the car straight back rather than
      // leaving it held for the rest of the window.
      releaseNow();
      setNmiPay(null);
      setNmiSubmitting(false);
      setNmiCardError(null);
    },
    nmiSubmitting,
    submitNmiPayment,
    nmiCardError,
    setNmiCardError,
    embedIntent,
    setEmbedIntent,
    paymentAnchorRef,
    verificationPolicy,
    startVerification,
    protectionRef,
    errorBannerRef,
    selectedInsurance,
    setSelectedInsurance,
    bonzahSelected,
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
    cardConsent,
    setCardConsent,
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
    minDuration,
    minDurationLabel: isHourlyFleet
      ? `${minHours} ${minHours === 1 ? 'hour' : 'hours'}`
      : `${minDuration} ${minDuration === 1 ? 'day' : 'days'}`,
    isHourlyFleet,
    meetsMinDuration,
    tripProblem,
    // The fleet payload is kept on screen while a date change refetches,
    // so its figures can belong to the previous window. Both templates
    // use this to stop presenting them as final.
    // One rule for both templates. The agreement and the card
    // authorization are the renter's two consents, and neither is
    // optional, so neither lets the button through.
    weekly: {
      options: ongoingOptions,
      model: ongoingQuote && !hideWeekly ? ongoingModel : null,
      unavailable: hideWeekly ? ongoingQuote?.reason ?? null : null,
      on: weeklyOn,
      canPickDate: dailyAllowed,
      set: setWeekly,
      offer,
      reason: ongoingQuote && !ongoingQuote.available ? ongoingQuote.reason : null,
      stale: ongoingStale,
      consent: weeklyConsent,
      setConsent: setWeeklyConsent,
    },
    reserveBlocked:
      reserving ||
      startCheckout.isPending ||
      startVerification.isPending ||
      startEmbedPayment.isPending ||
      (weeklyOn ? !offer || !weeklyConsent || ongoingStale : !meetsMinDuration || !!tripProblem) ||
      !cardConsent ||
      (rentalAgreementRequired && !rentalAgreementSigned),
    carId,
  };

  if (isLoading || insuranceOptionsLoading) {
    return { status: 'loading' as const, isLoading, insuranceOptionsLoading };
  }

  if (!vehicle) {
    return { status: 'not-found' as const };
  }

  const plans: InsuranceOption[] = (insuranceOptions ?? []).filter((p) =>
    ownOnly ? p.id === 'own' : cdwRequired ? p.id !== 'own' : true,
  );
  const recommendedPlanId = (plans.find((p) => p.price > 0) ?? plans[0])?.id ?? null;
  const selectedPlans = plans.filter((p) => selectedInsurance.has(p.id) && p.id !== 'own');
  const ownSelected = selectedInsurance.has('own');

  const galleryImages = vehicle.images.length > 0 ? vehicle.images : ['/images/vehicles/car_placeholder.svg'];

  const discount = pricing.discount;
  const total = weeklyOn ? Number(offer?.first.total ?? 0) + Number(offer?.deposit ?? 0) : pricing.total + abiPremium;
  const cardDeposit = weeklyOn && offer
    ? { amount: Number(offer.deposit), timing: weeklyDepositTiming(offer.deposit_method) }
    : { amount: pricing.deposit, timing: pricing.depositMode };

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
    if (ownOnly || (cdwRequired && (id === 'cdw' || id === 'own'))) return;
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
    if (reserveLock.current) return;
    reserveLock.current = true;
    setReserving(true);
    try {
      await runReserve();
    } finally {
      reserveLock.current = false;
      setReserving(false);
    }
  };

  const runReserve = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0 || !cardConsent) return;
    setCheckoutError('');

    if (!pickupDate || !pickupTime || (!weeklyOn && (!returnDate || !returnTime))) {
      setCheckoutError('Please select a pick-up date, pick-up time, return date, and return time.');
      return;
    }

    if (weeklyOn && !weeklyConsent) {
      setCheckoutError('Agree to the weekly charges to continue.');
      return;
    }

    const hasLocations = (companyLocations?.length ?? 0) > 0;
    if (hasLocations && !pickupLocId) {
      setCheckoutError('Please select a pickup location for your rental.');
      return;
    }

    if (weeklyOn && !offer) {
      setCheckoutError(ongoingQuote && !ongoingQuote.available ? ongoingQuote.reason : 'Weekly rental pricing is still loading.');
      return;
    }

    if (!bookingPayload || !fleetTz) {
      setCheckoutError("Couldn't determine the rental location's timezone, please refresh.");
      return;
    }

    const tz = fleetTz;
    const pickupDatetime = bookingPayload.pickup_datetime;
    const dropoffDatetime = bookingPayload.dropoff_datetime;

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

    const origin = window.location.origin;

    let freshPolicyMode = verificationPolicy?.mode;
    try {
      const fresh = await getBookingVerificationPolicy();
      freshPolicyMode = fresh.mode;
    } catch {
      void 0;
    }

    if (rentalAgreementRequired && !rentalAgreementSignature) {
      setCheckoutError('Please review and sign the rental agreement before continuing.');
      setRentalAgreementModalOpen(true);
      return;
    }

    const signaturePayload = rentalAgreementSignature
      ? { signature_image: rentalAgreementSignature }
      : {};

    const commonPayload = {
      ...bookingPayload,
      card_consent: cardConsent,
      customer: {
        first_name: fields.firstName.trim(),
        last_name: fields.lastName.trim(),
        email: fields.email.trim(),
        phone_no: fields.phone.trim().slice(0, 15),
        license_no: fields.license.trim(),
      },
      ...signaturePayload,
    };

    if (freshPolicyMode === 'before') {
      startVerification.mutate(checkoutBody(commonPayload), {
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

    // NMI: no hosted page exists to send the renter to, so the hold is
    // placed first and the card is taken in a payment window over this
    // page. Entering a card against a real reservation also means a
    // decline cannot lose their place.
    if (!embed.embedded && activeProvider === 'nmi') {
      try {
        const data = await startEmbedPayment.mutateAsync({ payload: commonPayload });
        registerHold(data.pending_id);
        try { window.sessionStorage.removeItem(persistKey); } catch { /* ignore */ }
        setNmiCardError(null);
        setNmiPay({
          pendingId: data.pending_id,
          amount: Number(data.amount) || total,
          currency: data.currency || 'usd',
          deposit: pricing.deposit,
        });
      } catch (error) {
        setCheckoutError(
          extractApiErrorMessage(error, 'We couldn\u2019t start checkout. Please check your details and try again.'),
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

  /** Charge the card the payment window collected. */
  async function submitNmiPayment({ paymentToken }: { paymentToken: string }) {
    if (!nmiPay) return;
    setNmiSubmitting(true);
    setNmiCardError(null);
    try {
      const body = await nmiCreatePaymentForPending({
        pendingId: nmiPay.pendingId,
        paymentToken,
        saveCard: cardConsent || nmiPay.deposit > 0,
      });
      suppressRelease({ clear: true });
      if (body.booking_id && body.access_token) {
        window.location.href = `/booking/${body.booking_id}?token=${encodeURIComponent(body.access_token)}`;
        return;
      }
      window.location.href = `/booking/success?session_id=${encodeURIComponent(nmiPay.pendingId)}`;
    } catch (error) {
      setNmiCardError(
        extractApiErrorMessage(error, 'We couldn\u2019t take that payment. Please check your card and try again.'),
      );
      setNmiSubmitting(false);
    }
  }

  const applyPromo = () => applyCode(promoInput);

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
    rates: rateCard(vehicle, rentalConfig, weeklyOn && ongoingModel ? { model: ongoingModel, plan: rentalConfig.plans.find((plan) => plan.id === planId) } : undefined),
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
    cardDeposit,
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
