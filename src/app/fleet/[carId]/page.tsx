'use client';

import { use } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { TextInput, FieldError } from '@/components/ui/field';
import { PhoneInput } from '@/components/ui/phone-input';
import { DateTimeField } from '@/components/search/date-time-field';
import { Check, Info, Pencil, ImageIcon, Close, ChevronLeft } from '@/components/ui/icons';
import { Dialog } from '@/components/ui/dialog';
import { DateDealsCallout } from '@/components/booking/date-deals-callout';
import { RentalBreakdown } from '@/components/booking/rental-breakdown';
import { EmbedPaymentPanel } from '@/components/checkout/embed-payment-panel';
import { SquareCardEntry, buildDepositConsentCopy } from '@/components/checkout/square-card-entry';
import ProtectionSection from '@/components/checkout/protection-section';
import { RentalAgreementSignModal } from '@/components/booking/rental-agreement-sign-modal';
import { toUtcIso } from '@/utils/datetime';
import { todayISO } from '@/lib/time-slots';
import { cn, money } from '@/lib/utils';
import { slotsBlockedOn, firstBlockInSpan } from '@/lib/unavailable-slots';
import { formatInTimeZone } from 'date-fns-tz';
import { paths } from '@/lib/paths';
import { useTenant } from '@/lib/tenant-context';
import { Dyn } from '@/components/i18n/Dyn';
import { useFleetDetail } from './use-fleet-detail';
import {
  SPEC_ICONS,
  EXTRA_ICON,
  formatTripStamp,
  LocationDropdown,
  InsuranceDetailModal,
  INSURANCE_DETAILS,
} from './fleet-detail-shared';
import FleetDetailClientT2 from './fleet-detail-client-t2';

export default function Page({ params }: { params: Promise<{ carId: string }> }) {
  const { carId } = use(params);
  // carId is the route param — either the vehicle's slug (normal case) or,
  // for older/manually-built links, its numeric id. The backend accepts
  // either at the same lookup path, so it's used as-is everywhere below.
  const tenant = useTenant();
  const fd = useFleetDetail(carId);

  if (tenant.websiteTemplate === 'template_2') {
    return <FleetDetailClientT2 carId={carId} />;
  }

  if (fd.status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1180px] flex-1 items-center justify-center px-6 py-24 text-center text-muted">
          <Dyn>{fd.isLoading ? 'Loading vehicle…' : 'Fetching insurance quotes…'}</Dyn>
        </div>
      </div>
    );
  }

  if (fd.status === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col items-center justify-center px-6 py-24 text-center text-muted">
          <div className="mb-4">
            <BackLink href={paths.fleet}><Dyn>Back to fleet</Dyn></BackLink>
          </div>
          <Dyn>Vehicle not found.</Dyn>
        </div>
      </div>
    );
  }

  const {
    t,
    embed,
    squareCardRef,
    squareCardError,
    setSquareCardError,
    providersData,
    activeProvider,
    embedIntent,
    setEmbedIntent,
    paymentAnchorRef,
    verificationPolicy,
    startCheckout,
    startVerification,
    startEmbedPayment,
    protectionRef,
    errorBannerRef,
    selectedInsurance,
    selectedManualIds,
    manualInsurancePackages,
    abiOptedIn,
    extras,
    promoApplied,
    promoAppliesTo,
    setPromoApplied,
    promoCode,
    promoDiscount,
    promoInput,
    setPromoInput,
    promoError,
    setPromoError,
    fields,
    errors,
    checkoutError,
    rentalAgreementSignature,
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
    fleetTz,
    unavailableRanges,
    unavailabilityIndex,
    unavailableDates,
    abiAvailable,
    days,
    rentalHours,
    minDuration,
    meetsMinDuration,
    tenant: tenantData,
    vehicle,
    plans,
    recommendedPlanId,
    selectedPlans,
    ownSelected,
    galleryImages,
    discount,
    total,
    isInsuranceDisabled,
    toggleInsurance,
    handleToggleAbi,
    handleToggleManual,
    gallery,
    photoCount,
    setField,
    blurField,
    setExtra,
    handlePickupDate,
    reserve,
    applyPromo,
    scrollProtection,
    hasErrors,
    pickupLocations,
    dropoffLocations,
    pickupCity,
    dropoffCity,
    minTime,
    maxTime,
    dropoffMinTime,
    dropoffMaxTime,
    pricing,
    extraInvoiceItems,
    insuranceLabel,
  } = fd;

  return (
    <div className="bg-white text-ink">
      <div className="mx-auto max-w-[1180px] px-6 pt-[22px] pb-16">
        <div className="mb-4 flex items-center justify-between gap-4">
          <BackLink href={paths.fleet}><Dyn>Back to fleet</Dyn></BackLink>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 rounded-[12px] border border-card-border bg-subtle p-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="h-[48px] w-[64px] flex-shrink-0 rounded-[8px] bg-cover bg-center"
              style={{ backgroundImage: `url('${galleryImages[0]}')` }}
            />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-secondary">{vehicle.name}</div>
              <div className="text-[11px] text-muted">{days} <Dyn>{days === 1 ? 'day' : 'days'}</Dyn></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[15px] font-bold text-secondary">{money(total)}</div>
            <div className="text-[10px] text-muted"><Dyn>Total</Dyn></div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          {/* min-w-0 lets this grid child shrink below its content's
              intrinsic min-content. Without it, a long token in any
              child (About-this-vehicle description, license plate,
              vehicle name…) grows the grid track past the viewport
              on phones and the whole page scrolls horizontally. */}
          <div className="min-w-0">
            <div className="mb-[14px] flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-secondary">
                  {vehicle.name}
                </h2>
                <div className="mt-[5px] flex items-center gap-2 text-[12.5px] text-muted">
                  <span><Dyn>Plate</Dyn> {vehicle.licensePlate}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[19px] font-bold text-secondary">{money(vehicle.pricePerDay)}</div>
                <div className="text-[11px] text-muted"><Dyn>per day</Dyn></div>
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
                    <Dyn>View all</Dyn> {photoCount} <Dyn>photos</Dyn>
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-[14px] rounded-[12px] border border-card-border px-4 py-[15px] sm:grid-cols-3">
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
                      <div className="text-[10.5px] text-muted"><Dyn>{label}</Dyn></div>
                      <div className="text-[13px] font-semibold">{value}</div>
                    </div>
                  </div>
                ))}
            </div>

            {vehicle.description && (
              <>
                <h3 className="mb-[10px] text-[15px] font-semibold text-ink"><Dyn>About this vehicle</Dyn></h3>
                {/* break-words + whitespace-pre-line: long unbroken
                    tokens (URLs, model numbers, hashtags) wrap
                    inside the container instead of pushing the
                    whole page wider than the viewport on phones,
                    while operator-typed newlines are preserved. */}
                <div className="mb-[26px] text-[13px] leading-[1.7] text-muted break-words whitespace-pre-line">
                  {vehicle.description}
                </div>
              </>
            )}

            <ProtectionSection
              headingRef={protectionRef}
              bonzahPlans={plans}
              manualPackages={manualInsurancePackages ?? []}
              selectedBonzah={selectedInsurance}
              selectedManualIds={selectedManualIds}
              onToggleBonzah={toggleInsurance}
              onToggleManual={handleToggleManual}
              onOpenBonzahDetail={setDetailId}
              isBonzahDisabled={isInsuranceDisabled}
              hasBonzahDetail={(id) => !!INSURANCE_DETAILS[id]}
              recommendedBonzahId={recommendedPlanId ?? undefined}
              abiQuote={abiAvailable}
              abiOpted={abiOptedIn}
              onToggleAbi={handleToggleAbi}
            />

            {vehicle.extras.length > 0 && (
              <>
            <h3 className="mb-3 text-[15px] font-semibold text-ink"><Dyn>Add extras</Dyn></h3>
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
                        <Dyn>Add</Dyn>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
              </>
            )}

            <h3 className="mb-3 text-[15px] font-semibold text-ink"><Dyn>Driver details</Dyn></h3>
            <div className="grid grid-cols-1 gap-x-3 gap-y-[14px] sm:grid-cols-2">
              <div>
                <TextInput value={fields.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder={t('First name')} error={!!errors.firstName} />
                {errors.firstName && <FieldError><Dyn>{errors.firstName}</Dyn></FieldError>}
              </div>
              <div>
                <TextInput value={fields.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder={t('Last name')} error={!!errors.lastName} />
                {errors.lastName && <FieldError><Dyn>{errors.lastName}</Dyn></FieldError>}
              </div>
              <div>
                <TextInput type="email" value={fields.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => blurField('email')} placeholder={t('Email address')} error={!!errors.email} />
                {errors.email && <FieldError><Dyn>{errors.email}</Dyn></FieldError>}
              </div>
              <div>
                <PhoneInput value={fields.phone} onChange={(v) => setField('phone', v)} onBlur={() => blurField('phone')} error={!!errors.phone} placeholder={t('Phone number')} />
                {errors.phone && <FieldError><Dyn>{errors.phone}</Dyn></FieldError>}
              </div>
            </div>

            {!embed.embedded && activeProvider === 'square' && providersData?.square && verificationPolicy?.mode !== 'before' ? (
              <div className="mt-6">
                <SquareCardEntry
                  ref={squareCardRef}
                  applicationId={providersData.square.application_id}
                  locationId={providersData.square.location_id}
                  environment={(providersData.square.environment as 'sandbox' | 'production') || 'production'}
                  requiresDeposit={Number((vehicle as any)?.securityDeposit) > 0}
                  depositConsentCopy={
                    Number((vehicle as any)?.securityDeposit) > 0
                      ? buildDepositConsentCopy({
                          tenantName: tenantData?.name,
                          amount: Number((vehicle as any)?.securityDeposit) || 0,
                          currency: 'usd',
                        })
                      : undefined
                  }
                  onError={setSquareCardError}
                />
              </div>
            ) : null}

            {embedIntent ? (
              <div ref={paymentAnchorRef}>
              <EmbedPaymentPanel
                provider={embedIntent.provider}
                clientSecret={embedIntent.clientSecret}
                publishableKey={embedIntent.publishableKey}
                stripeAccountId={embedIntent.stripeAccountId}
                pendingId={embedIntent.pendingId}
                providerExtra={embedIntent.providerExtra}
                returnUrl={`${origin}/booking/success?session_id=${embedIntent.pendingId}`}
                amount={embedIntent.amount}
                currency={embedIntent.currency}
                depositAmount={Number(vehicle?.securityDeposit) || 0}
                tenantName={tenantData?.name}
                onCancel={() => {
                  fd.releaseNow();
                  setEmbedIntent(null);
                }}
                onSuccess={() => {
                  fd.suppressRelease({ clear: true });
                  if (embed.embedded) embed.reportBookingComplete(0);
                  setEmbedIntent(null);
                }}
              />
              </div>
            ) : null}

          </div>

          <div className="rounded-2xl border border-card-border bg-subtle p-4 sm:p-[22px] lg:sticky lg:top-[88px]">
            <div className="mb-3 text-sm font-semibold text-ink"><Dyn>Your trip</Dyn></div>
            <div className="flex flex-col gap-2">
              <div
                onClick={() => setTripOpen(true)}
                className="flex cursor-pointer items-center justify-between rounded-[10px] border border-card-border bg-white px-[13px] py-[11px]"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.03em] text-muted"><Dyn>Pick-up</Dyn></div>
                  <div className="mt-[2px] text-[12.5px] font-semibold text-secondary">{pickupCity} · {formatTripStamp(pickupDate, pickupTime)}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Dyn>Edit</Dyn> <Pencil size={12} strokeWidth={2} />
                </span>
              </div>
              <div
                onClick={() => setTripOpen(true)}
                className="flex cursor-pointer items-center justify-between rounded-[10px] border border-card-border bg-white px-[13px] py-[11px]"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.03em] text-muted"><Dyn>Drop-off</Dyn></div>
                  <div className="mt-[2px] text-[12.5px] font-semibold text-secondary">{dropoffCity} · {formatTripStamp(returnDate, returnTime)}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Dyn>Edit</Dyn> <Pencil size={12} strokeWidth={2} />
                </span>
              </div>
            </div>
            <div className="my-[18px] h-px bg-card-border" />

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink"><Dyn>Price details</Dyn></span>
              <span className="rounded-full border border-line bg-white px-[10px] py-[3px] text-[11px] font-medium text-muted">{days} <Dyn>days</Dyn></span>
            </div>

            <DateDealsCallout
              className="mb-4"
              days={days}
              isPeakPricing={vehicle.isPeakPricing}
              isPromoPricing={vehicle.isPromoPricing}
            />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted"><Dyn>Rental</Dyn></div>
            <RentalBreakdown
              rateUnit={pricing.rateUnit}
              pricePerHour={vehicle.pricePerHour}
              rentalHours={rentalHours}
              pricePerDay={vehicle.pricePerDay}
              days={days}
              dailyRates={vehicle.dailyRates}
              total={pricing.subtotal - pricing.insuranceCost - pricing.extrasCost}
            />
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted"><Dyn>Insurance</Dyn>{insuranceLabel ? ` (${insuranceLabel})` : ''}</span>
              <span onClick={scrollProtection} className="cursor-pointer text-[11px] font-semibold text-primary"><Dyn>Change</Dyn></span>
            </div>
            {selectedPlans.length > 0 || (fd.selectedManualPackages?.length ?? 0) > 0 || (abiAvailable && abiOptedIn) ? (
              <div className="flex flex-col gap-[10px]">
                {selectedPlans.map((p) => (
                  <div key={`bonzah-${p.id}`} className="flex items-start justify-between text-[13px]">
                    <div>
                      <div className="font-medium text-ink"><Dyn>{p.title}</Dyn></div>
                      <div className="mt-px text-[11.5px] text-muted">{money(p.price)} × {days} <Dyn>days</Dyn></div>
                    </div>
                    <span className="font-medium text-ink">{money(p.totalPrice ?? p.price * days)}</span>
                  </div>
                ))}
                {fd.selectedManualPackages?.map((pkg) => (
                  <div key={`manual-${pkg.id}`} className="flex items-start justify-between text-[13px]">
                    <div>
                      <div className="font-medium text-ink"><Dyn>{pkg.title}</Dyn></div>
                      <div className="mt-px text-[11.5px] text-muted">{money(pkg.dailyRate)} × {days} <Dyn>days</Dyn></div>
                    </div>
                    <span className="font-medium text-ink">{money(pkg.dailyRate * days)}</span>
                  </div>
                ))}
                {abiAvailable && abiOptedIn && (
                  <div className="flex items-start justify-between text-[13px]">
                    <div>
                      <div className="font-medium text-ink"><Dyn>Rental Coverage</Dyn></div>
                      <div className="mt-px text-[11.5px] text-muted">{money(Number(abiAvailable.daily_price))} × {abiAvailable.days} <Dyn>days</Dyn></div>
                    </div>
                    <span className="font-medium text-ink">{money(Number(abiAvailable.total_price))}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start justify-between text-[13px]">
                <div className="font-medium text-ink"><Dyn>{ownSelected ? 'Own insurance' : 'No protection selected'}</Dyn></div>
                <span className="font-medium text-ink">{money(0)}</span>
              </div>
            )}
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted"><Dyn>Add-ons</Dyn></div>
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
                <span className="text-placeholder"><Dyn>None added yet</Dyn></span>
                <span className="font-medium text-muted">$0.00</span>
              </div>
            )}
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted"><Dyn>Discounts</Dyn></div>
            {/* Duration-based fleet discount — shown when a daily,
                weekly or hourly tier has fired. Distinct from the
                promo-code row below so the customer sees exactly where
                each saving comes from. */}
            {pricing.fleetDiscount > 0 && pricing.fleetDiscountTier && (
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-[7px]">
                  <span className="font-medium text-primary">
                    <Dyn>{pricing.fleetDiscountTier.unitType === 'week'
                      ? 'Weekly discount'
                      : pricing.fleetDiscountTier.unitType === 'hour'
                        ? 'Hourly discount'
                        : 'Long-rental discount'}</Dyn>
                  </span>
                  <span className="inline-flex items-center rounded-[5px] bg-primary-soft px-[7px] py-[2px] text-[10px] font-semibold text-primary">
                    {pricing.fleetDiscountTier.percentage}% <Dyn>OFF</Dyn>
                  </span>
                </div>
                <span className="font-semibold text-primary">−{money(pricing.fleetDiscount)}</span>
              </div>
            )}
            {promoApplied && (
              <div className={cn(
                'flex items-start justify-between gap-3 text-[13px]',
                pricing.fleetDiscount > 0 ? 'mt-2' : '',
              )}>
                <div className="min-w-0">
                 <div className="flex items-center gap-[7px]">
                  <span className="font-medium text-primary"><Dyn>Promo</Dyn></span>
                  <span className="inline-flex items-center gap-[5px] rounded-[5px] bg-primary-soft py-[2px] pl-[7px] pr-[5px] text-[10px] font-semibold text-primary">
                    {promoCode}
                    <button
                      type="button"
                      aria-label={t('Remove promo code')}
                      onClick={() => setPromoApplied(false)}
                      className="cursor-pointer text-[11px] leading-none"
                    >
                      ✕
                    </button>
                  </span>
                 </div>
                 {promoAppliesTo.length > 0 && (
                   <p className="mt-[3px] text-[11px] text-muted">
                     <Dyn>Applied to</Dyn>: {promoAppliesTo.join(', ')}
                   </p>
                 )}
                </div>
                <span className="whitespace-nowrap font-semibold text-primary">−{money(promoDiscount)}</span>
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
                placeholder={t('Enter promo code')}
                className="flex-1 border-none bg-transparent text-[12.5px] text-ink outline-none"
              />
              <button type="button" onClick={applyPromo} className="cursor-pointer rounded-[7px] bg-secondary px-4 py-2 text-[12px] font-semibold text-white">
                <Dyn>Apply</Dyn>
              </button>
            </div>
            {promoError && <FieldError><Dyn>{promoError}</Dyn></FieldError>}
            <div className="my-[14px] h-px bg-card-border" />

            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted"><Dyn>Charges &amp; taxes</Dyn></div>
            <div className="flex flex-col gap-[10px] text-[13px]">
              {pricing.locationCharges > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted"><Dyn>Location charges</Dyn></span>
                  <span className="font-medium text-ink">{money(pricing.locationCharges)}</span>
                </div>
              )}
              {pricing.bookingFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted"><Dyn>Booking fees</Dyn></span>
                  <span className="font-medium text-ink">{money(pricing.bookingFee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted"><Dyn>Tax</Dyn></span>
                <span className="font-medium text-ink">{money(pricing.tax)}</span>
              </div>
              {pricing.deposit > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">
                    <Dyn>Security deposit</Dyn> <span className="text-[11px]"><Dyn>(refundable)</Dyn></span>
                  </span>
                  <span className="font-medium text-ink">{money(pricing.deposit)}</span>
                </div>
              )}
            </div>
            <div className="my-4 h-px bg-card-border" />

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[15px] font-bold text-ink"><Dyn>Total</Dyn></div>
                {promoApplied && (
                  <div className="mt-[2px] inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Check size={12} strokeWidth={2.4} />
                    <Dyn>You&apos;re saving</Dyn> {money(discount)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="mr-[3px] text-[11px] text-muted">USD</span>
                <span className="text-[22px] font-bold text-secondary">{money(total + (pricing.deposit || 0))}</span>
              </div>
            </div>

            {pricing.deposit > 0 && (
              <div className="mt-[6px] text-[11px] leading-[1.5] text-muted">
                <Dyn>Includes a refundable</Dyn> {money(pricing.deposit)} <Dyn>security deposit, refunded after your trip minus any damage claims.</Dyn>
              </div>
            )}

            {!meetsMinDuration && (
              <div className="mt-4 flex items-center gap-[7px] rounded-[9px] border border-danger-border bg-danger-bg px-3 py-[9px] text-[11.5px] leading-[1.4] text-danger-text">
                <Info size={14} strokeWidth={2} className="flex-shrink-0 text-danger" />
                <Dyn>This vehicle has a minimum rental of</Dyn> {minDuration} <Dyn>{minDuration === 1 ? 'day' : 'days'}</Dyn>. <Dyn>Choose a longer trip to continue.</Dyn>
              </div>
            )}

            {(hasErrors || checkoutError) && (
              <div
                ref={errorBannerRef}
                className="mt-4 flex items-center gap-[7px] rounded-[9px] border border-danger-border bg-danger-bg px-3 py-[9px] text-[11.5px] leading-[1.4] text-danger-text"
              >
                <Info size={14} strokeWidth={2} className="flex-shrink-0 text-danger" />
                <Dyn>{checkoutError || 'Please fix the highlighted fields to continue.'}</Dyn>
              </div>
            )}

            <button
              onClick={() => reserve()}
              disabled={
                startCheckout.isPending ||
                startVerification.isPending ||
                startEmbedPayment.isPending ||
                !meetsMinDuration ||
                (rentalAgreementRequired && !rentalAgreementSigned)
              }
              className="mt-[14px] block w-full cursor-pointer rounded-[10px] bg-primary py-[13px] text-center text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Dyn>{startCheckout.isPending || startVerification.isPending || startEmbedPayment.isPending
                ? 'Starting checkout…'
                : 'Reserve Now'}</Dyn>
            </button>

            {rentalAgreementRequired && (
              <button
                type="button"
                onClick={() => setRentalAgreementModalOpen(true)}
                className={cn(
                  'mt-[13px] flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border px-3 py-2 text-left transition-colors',
                  rentalAgreementSigned
                    ? 'border-green-border bg-green-bg hover:bg-green-bg-2'
                    : 'border-primary-border bg-primary-soft hover:bg-primary-soft/70',
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      'inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                      rentalAgreementSigned
                        ? 'border-success bg-success'
                        : 'border-primary bg-white',
                    )}
                  >
                    {rentalAgreementSigned && (
                      <Check size={11} strokeWidth={3.2} className="text-white" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'truncate text-[12px] font-semibold',
                      rentalAgreementSigned ? 'text-success' : 'text-ink',
                    )}
                  >
                    <Dyn>{rentalAgreementSigned
                      ? 'Rental Agreement signed'
                      : 'Sign Rental Agreement · required'}</Dyn>
                  </span>
                </span>
                {rentalAgreementSigned && (
                  <span className="flex-shrink-0 whitespace-nowrap text-[11.5px] font-semibold text-success underline">
                    <Dyn>Review</Dyn>
                  </span>
                )}
              </button>
            )}

            <div className="mt-4 flex flex-col gap-[9px]">
              {['No hidden fees, price you see is final', 'Encrypted, secure payment'].map((line) => (
                <div key={line} className="flex items-center gap-2 text-[11.5px] text-muted">
                  <Check size={14} strokeWidth={2} className="text-primary" />
                  <Dyn>{line}</Dyn>
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
                <button
                  key={i}
                  type="button"
                  aria-label={`View image ${i + 1}`}
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

      <Dialog
        isOpen={tripOpen}
        onClose={() => setTripOpen(false)}
        labelledBy="trip-edit-title"
        panelClassName="max-w-[460px] p-[26px]"
      >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 id="trip-edit-title" className="text-[18px] font-semibold text-secondary"><Dyn>Edit your trip</Dyn></h3>
              <button
                type="button"
                aria-label={t('Close')}
                onClick={() => setTripOpen(false)}
                className="text-muted"
              >
                <Close size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted"><Dyn>Pick-up location</Dyn></div>
                <LocationDropdown
                  open={openLocDropdown === 'pickup'}
                  onToggle={() => setOpenLocDropdown((o) => (o === 'pickup' ? null : 'pickup'))}
                  onClose={() => setOpenLocDropdown(null)}
                  options={pickupLocations}
                  value={pickupLocId}
                  placeholder="Select pick-up location"
                  onSelect={(id) => {
                    setPickupLocId(id);
                    if (!dropoffLocId || dropoffLocId === pickupLocId) {
                      const match = dropoffLocations.find((l) => String(l.id) === id);
                      if (match) setDropoffLocId(id);
                    }
                    setOpenLocDropdown(null);
                  }}
                />
              </div>
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted"><Dyn>Drop-off location</Dyn></div>
                <LocationDropdown
                  open={openLocDropdown === 'dropoff'}
                  onToggle={() => setOpenLocDropdown((o) => (o === 'dropoff' ? null : 'dropoff'))}
                  onClose={() => setOpenLocDropdown(null)}
                  options={dropoffLocations}
                  value={dropoffLocId}
                  placeholder="Select drop-off location"
                  onSelect={(id) => {
                    setDropoffLocId(id);
                    setOpenLocDropdown(null);
                  }}
                />
              </div>
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted"><Dyn>Pick-up date &amp; time</Dyn></div>
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
                    disabledSlots={slotsBlockedOn(unavailabilityIndex, pickupDate, 'pickup')}
                    label={t('Pick-up')}
                  />
                </div>
              </div>
              <div>
                <div className="mb-[7px] text-[11px] uppercase tracking-[0.03em] text-muted"><Dyn>Return date &amp; time</Dyn></div>
                <div className="rounded-[9px] border border-line px-[14px] py-3">
                  <DateTimeField
                    date={returnDate}
                    time={returnTime}
                    onDate={setReturnDate}
                    onTime={setReturnTime}
                    minDate={pickupDate || todayISO()}
                    minTime={dropoffMinTime}
                    maxTime={dropoffMaxTime}
                    highlightDate={pickupDate}
                    unavailableDates={unavailableDates}
                    disabledSlots={slotsBlockedOn(unavailabilityIndex, returnDate, 'dropoff')}
                    label={t('Return')}
                  />
                </div>
              </div>
            </div>
            <DateDealsCallout
              className="mt-5"
              days={days}
              isPeakPricing={vehicle.isPeakPricing}
              isPromoPricing={vehicle.isPromoPricing}
            />
            {tripError && (
              <p className="mt-3 text-[12px] leading-snug text-danger">{tripError}</p>
            )}
            <button
              onClick={() => {
                const conflict =
                  fleetTz && pickupDate && returnDate
                    ? firstBlockInSpan(
                        unavailableRanges,
                        new Date(toUtcIso(pickupDate, pickupTime || '00:00', fleetTz)).getTime(),
                        new Date(toUtcIso(returnDate, returnTime || '00:00', fleetTz)).getTime(),
                      )
                    : null;
                if (conflict && fleetTz) {
                  setTripError(
                    `Part of that window is unavailable | this vehicle is already booked or blocked from ${formatInTimeZone(new Date(conflict.start), fleetTz, 'MMM d, h:mm a')}. Please adjust your dates or times.`,
                  );
                  return;
                }
                setTripError(null);
                setTripOpen(false);
              }}
              className="mt-[22px] w-full rounded-[9px] bg-primary py-3 text-center text-sm font-semibold text-white"
            >
              <Dyn>Update trip</Dyn>
            </button>
      </Dialog>

      <RentalAgreementSignModal
        open={rentalAgreementModalOpen}
        onClose={() => setRentalAgreementModalOpen(false)}
        initialSignature={rentalAgreementSignature}
        showBonzahAddendum={selectedInsurance.size > 0}
        onSigned={(dataUri) => {
          fd.setRentalAgreementSignature(dataUri);
          setRentalAgreementModalOpen(false);
        }}
      />

    </div>
  );
}
