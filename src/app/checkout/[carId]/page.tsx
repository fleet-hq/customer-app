'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { TextInput, FieldError } from '@/components/ui/field';
import { DateTimeField } from '@/components/search/date-time-field';
import { Check, Info, Pencil, ImageIcon, Close, ChevronLeft } from '@/components/ui/icons';
import { VALID_PROMOS, PROMO_DISCOUNT_PCT, DEFAULT_TRIP } from '@/lib/mock-data';
import { useFleet, useInsuranceOptions, useStartBookingCheckout, useCompanyLocations } from '@/hooks';
import { useDefaultLocation } from '@/contexts';
import type { InsuranceOption } from '@/services/bookingServices';
import { toUtcIso } from '@/utils/datetime';
import { todayISO } from '@/lib/time-slots';
import { cn, money, rentalDays } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { useAgreementSigned } from '@/lib/booking-state';

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

export default function Page({ params }: { params: Promise<{ carId: string }> }) {
  const { carId } = use(params);
  const router = useRouter();
  const agreed = useAgreementSigned();

  const { data: vehicle, isLoading } = useFleet(carId);
  const { data: insuranceOptions } = useInsuranceOptions();
  const { data: companyLocations } = useCompanyLocations();
  const defaultLoc = useDefaultLocation();
  const startCheckout = useStartBookingCheckout();
  const protectionRef = useRef<HTMLHeadingElement>(null);

  const [plan, setPlan] = useState<string | null>(null);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [promoApplied, setPromoApplied] = useState(true);
  const [promoCode, setPromoCode] = useState(VALID_PROMOS[0]);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [fields, setFields] = useState<Fields>({ name: '', email: '', phone: '', license: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [checkoutError, setCheckoutError] = useState('');

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverPlan, setCoverPlan] = useState('standard');
  const [tripOpen, setTripOpen] = useState(false);
  const [pickupLoc, setPickupLoc] = useState('');
  const [pickupDate, setPickupDate] = useState(DEFAULT_TRIP.pickupDate);
  const [pickupTime, setPickupTime] = useState(DEFAULT_TRIP.pickupTime);
  const [returnDate, setReturnDate] = useState(DEFAULT_TRIP.returnDate);
  const [returnTime, setReturnTime] = useState(DEFAULT_TRIP.returnTime);

  useEffect(() => {
    if (pickupLoc || !companyLocations?.length) return;
    const def = companyLocations.find((l) => String(l.id) === String(defaultLoc?.id)) ?? companyLocations[0];
    setPickupLoc(def.name);
  }, [companyLocations, defaultLoc, pickupLoc]);

  if (isLoading) {
    return (
      <div className="bg-white text-ink">
        <Header active="Fleet" />
        <div className="mx-auto max-w-[1180px] px-6 py-24 text-center text-muted">Loading vehicle…</div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="bg-white text-ink">
        <Header active="Fleet" />
        <div className="mx-auto max-w-[1180px] px-6 py-24 text-center text-muted">
          <div className="mb-4">
            <BackLink href={paths.fleet}>Back to fleet</BackLink>
          </div>
          Vehicle not found.
        </div>
        <Footer />
      </div>
    );
  }

  const days = rentalDays(pickupDate, returnDate, pickupTime, returnTime);

  const plans: InsuranceOption[] = insuranceOptions ?? [];
  const selectedPlanId = plan ?? plans[0]?.id ?? null;
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;
  const recommendedPlanId = (plans.find((p) => p.price > 0) ?? plans[0])?.id ?? null;

  const galleryImages = vehicle.images.length > 0 ? vehicle.images : ['/images/car-cherokee.png'];

  const rental = vehicle.pricePerDay * days;
  const planPerDay = selectedPlan?.price ?? 0;
  const planTotal = planPerDay * days;
  const extrasTotal = vehicle.extras.reduce(
    (s, x) => s + x.price * (extras[x.id] || 0) * (x.priceUnit === '/day' ? days : 1),
    0,
  );
  const discount = promoApplied ? Math.round(rental * PROMO_DISCOUNT_PCT) / 100 : 0;
  const total = rental + planTotal + extrasTotal - discount;

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

  const setExtra = (id: string, delta: number) => {
    setExtras((s) => ({ ...s, [id]: Math.max(0, (s[id] || 0) + delta) }));
  };

  const activeExtras = vehicle.extras
    .filter((x) => (extras[x.id] || 0) > 0)
    .map((x) => {
      const c = extras[x.id];
      const mult = x.priceUnit === '/day' ? days : 1;
      return {
        name: `${x.title} ×${c}`,
        sub: `${money(x.price)}${x.priceUnit}${c > 1 ? ` × ${c}` : ''}`,
        amount: money(x.price * c * mult),
      };
    });

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

    const tz = defaultLoc?.timezone ?? null;
    const toIso = (d: string, t: string) => (tz ? toUtcIso(d, t, tz) : `${d}T${t}:00`);
    const locationId = Number(companyLocations?.find((l) => l.name === pickupLoc)?.id ?? defaultLoc?.id ?? 0);
    const nameParts = fields.name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '-';
    const activeExtraItems = vehicle.extras
      .filter((x) => (extras[x.id] || 0) > 0)
      .map((x) => ({ id: Number(x.id), quantity: extras[x.id] }))
      .filter((x) => !Number.isNaN(x.id));
    const insuranceSelected = !!selectedPlan && selectedPlan.id !== 'own';
    const origin = window.location.origin;

    try {
      const data = await startCheckout.mutateAsync({
        fleet_id: Number(vehicle.id),
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: fields.email.trim(),
          phone_no: fields.phone.trim().slice(0, 15),
        },
        pickup_datetime: toIso(pickupDate, pickupTime),
        dropoff_datetime: toIso(returnDate, returnTime),
        pickup_location_id: locationId,
        dropoff_location_id: locationId,
        insurance_selected: insuranceSelected,
        cdw_cover: selectedPlan?.id === 'cdw',
        rcli_cover: selectedPlan?.id === 'rcli',
        sli_cover: selectedPlan?.id === 'sli',
        pai_cover: selectedPlan?.id === 'pai',
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

  const applyPromo = () => {
    const c = promoInput.trim().toUpperCase();
    if (!c) {
      setPromoError('Enter a promo code');
      return;
    }
    if (!VALID_PROMOS.includes(c)) {
      setPromoError(`“${c}” is not a valid code`);
      return;
    }
    setPromoApplied(true);
    setPromoCode(c);
    setPromoInput('');
    setPromoError('');
  };

  const scrollProtection = () => {
    const el = protectionRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  };

  const hasErrors = Object.keys(errors).length > 0;
  const planRowName = selectedPlan ? selectedPlan.title : 'Protection';
  const planSub = planPerDay === 0 ? 'No charge' : `${money(planPerDay)} × ${days} days`;
  const pickupCity = pickupLoc.split(',')[0];

  return (
    <div className="bg-white text-ink">
      <Header active="Fleet" />
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
                const sel = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={cn(
                      'relative flex cursor-pointer flex-col rounded-[12px] p-[14px] transition-colors',
                      sel ? 'border-[1.5px] border-primary bg-primary-soft' : 'border border-line bg-white',
                    )}
                  >
                    {recommendedPlanId === p.id && (
                      <span className="absolute right-3 top-3 rounded-[5px] bg-primary px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[0.03em] text-white">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-center gap-[9px]">
                      <span
                        className={cn(
                          'h-[17px] w-[17px] flex-shrink-0 rounded-full bg-white',
                          sel ? 'border-[5px] border-primary' : 'border-[1.5px] border-control',
                        )}
                      />
                      <span className="text-[13.5px] font-semibold text-ink">{p.title}</span>
                    </div>
                    <div className="mt-[9px] flex-1 text-[12px] leading-[1.5] text-muted">{p.description}</div>
                    <div className={cn('mt-3 text-[16px] font-bold', sel ? 'text-primary' : 'text-ink')}>
                      {p.price === 0 ? '$0.00' : money(p.price)}
                      <span className="text-[11px] font-normal text-muted">{p.price === 0 ? '' : '/day'}</span>
                    </div>
                    <div className={cn('mt-3 border-t pt-[10px]', sel ? 'border-primary-border' : 'border-hairline')}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverPlan(p.id);
                          setCoverOpen(true);
                        }}
                        className="inline-flex cursor-pointer items-center gap-[5px] text-[11.5px] font-semibold text-primary"
                      >
                        <Info size={13} strokeWidth={2} />
                        See what&apos;s covered
                      </span>
                    </div>
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
                <TextInput value={fields.email} onChange={(e) => setField('email', e.target.value)} placeholder="Email address" error={!!errors.email} />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </div>
              <div>
                <TextInput value={fields.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="Phone number" error={!!errors.phone} />
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
                  <div className="mt-[2px] text-[12.5px] font-semibold text-secondary">{pickupCity} · {formatTripStamp(returnDate, returnTime)}</div>
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

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Rental</div>
            <div className="flex items-start justify-between text-[13px]">
              <div>
                <div className="font-medium text-ink">Car rental</div>
                <div className="mt-px text-[11.5px] text-muted">{money(vehicle.pricePerDay)} × {days} days</div>
              </div>
              <span className="font-medium text-ink">{money(rental)}</span>
            </div>
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Insurance</span>
              <span onClick={scrollProtection} className="cursor-pointer text-[11px] font-semibold text-primary">Change</span>
            </div>
            <div className="flex items-start justify-between text-[13px]">
              <div>
                <div className="font-medium text-ink">{planRowName}</div>
                <div className="mt-px text-[11.5px] text-muted">{planSub}</div>
              </div>
              <span className="font-medium text-ink">{money(planTotal)}</span>
            </div>
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Add-ons</div>
            {activeExtras.length > 0 ? (
              <div className="flex flex-col gap-[10px]">
                {activeExtras.map((a) => (
                  <div key={a.name} className="flex items-start justify-between text-[13px]">
                    <div>
                      <div className="font-medium text-ink">{a.name}</div>
                      <div className="mt-px text-[11.5px] text-muted">{a.sub}</div>
                    </div>
                    <span className="font-medium text-ink">{a.amount}</span>
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
            {promoApplied && (
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-[7px]">
                  <span className="font-medium text-primary">Discount</span>
                  <span className="inline-flex items-center gap-[5px] rounded-[5px] bg-primary-soft py-[2px] pl-[7px] pr-[5px] text-[10px] font-semibold text-primary">
                    {promoCode}
                    <span onClick={() => setPromoApplied(false)} className="cursor-pointer text-[11px] leading-none">
                      ✕
                    </span>
                  </span>
                </div>
                <span className="font-semibold text-primary">−{money(discount)}</span>
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

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Taxes &amp; fees</div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-[5px] text-muted">Sales tax &amp; surcharges</span>
              <span className="font-medium text-ink">Included</span>
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

            {(hasErrors || checkoutError) && (
              <div className="mt-4 flex items-center gap-[7px] rounded-[9px] border border-danger-border bg-danger-bg px-3 py-[9px] text-[11.5px] leading-[1.4] text-danger-text">
                <Info size={14} strokeWidth={2} className="flex-shrink-0 text-danger" />
                {checkoutError || 'Please fix the highlighted fields to continue.'}
              </div>
            )}

            <button
              onClick={reserve}
              disabled={startCheckout.isPending}
              className="mt-[14px] block w-full cursor-pointer rounded-[10px] bg-primary py-[13px] text-center text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startCheckout.isPending ? 'Starting checkout…' : 'Reserve Now'}
            </button>

            <Link href={paths.terms} className="mt-[13px] flex cursor-pointer items-start gap-[10px] no-underline">
              <span
                className={cn(
                  'mt-px inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                  agreed ? 'border-primary bg-primary' : 'border-control bg-white',
                )}
              >
                {agreed && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className="text-[11.5px] leading-[1.5] text-muted">
                I have read and agree to the <span className="font-semibold text-secondary">Terms of Service</span> &amp;{' '}
                <span className="font-semibold text-primary underline">Rental Agreement</span>
                {agreed ? ' — signed.' : ' — tap to review & sign.'}
              </span>
            </Link>

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
      <Footer />

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

      {coverOpen && (
        <CoverModal plans={plans} planId={coverPlan} onClose={() => setCoverOpen(false)} />
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
                  value={pickupLoc}
                  onChange={(e) => setPickupLoc(e.target.value)}
                  className="h-[46px] w-full rounded-[10px] border border-line bg-white px-[14px] text-sm text-ink outline-none transition-colors focus:border-primary"
                >
                  {(companyLocations ?? []).length === 0 && <option value="">No locations available</option>}
                  {(companyLocations ?? []).map((l) => (
                    <option key={l.id} value={l.name}>
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
                    onDate={setPickupDate}
                    onTime={setPickupTime}
                    minDate={todayISO()}
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
                    highlightDate={pickupDate}
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

function CoverModal({ plans, planId, onClose }: { plans: InsuranceOption[]; planId: string; onClose: () => void }) {
  const p = plans.find((x) => x.id === planId) ?? plans[0] ?? null;
  if (!p) return null;
  const title = `${p.title} — what’s covered`;
  const price = p.price === 0 ? '$0.00' : `${money(p.price)}/day`;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(12,14,12,0.55)] p-6">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[460px] rounded-2xl bg-white p-[26px] shadow-[var(--shadow-pop)]">
        <div className="mb-[6px] flex items-start justify-between gap-4">
          <h3 className="text-[18px] font-semibold text-secondary">{title}</h3>
          <span onClick={onClose} className="flex-shrink-0 cursor-pointer text-muted">
            <Close size={20} strokeWidth={2} />
          </span>
        </div>
        <div className="mb-[18px] text-[13px] text-muted">{price}</div>
        <div className="flex flex-col gap-3">
          {p.features.map((text, i) => (
            <div key={i} className="flex items-start gap-[10px]">
              <span className="mt-px inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-bg-2 text-[12px] font-bold text-success">
                ✓
              </span>
              <span className="text-[13px] leading-[1.5] text-label">{text}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-[22px] w-full rounded-[9px] bg-secondary py-3 text-center text-sm font-semibold text-white">
          Got it
        </button>
      </div>
    </div>
  );
}
