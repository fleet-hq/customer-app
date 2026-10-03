'use client';

import { TextInput, FieldError } from '@/components/ui/field';
import { PhoneInput } from '@/components/ui/phone-input';
import { DateTimeField } from '@/components/search/date-time-field';
import { Check, Info, Close, ChevronLeft } from '@/components/ui/icons';
import { Dialog } from '@/components/ui/dialog';
import { DateDealsCallout } from '@/components/booking/date-deals-callout';
import { RentalBreakdown } from '@/components/booking/rental-breakdown';
import { EmbedPaymentPanel } from '@/components/checkout/embed-payment-panel';
import { SquareCardEntry, buildDepositConsentCopy } from '@/components/checkout/square-card-entry';
import ProtectionSection from '@/components/checkout/protection-section';
import { RentalAgreementSignModal } from '@/components/booking/rental-agreement-sign-modal';
import { toUtcIso } from '@/utils/datetime';
import { todayISO } from '@/lib/time-slots';
import { money } from '@/lib/utils';
import { slotsBlockedOn, firstBlockInSpan } from '@/lib/unavailable-slots';
import { formatInTimeZone } from 'date-fns-tz';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useFleetDetail } from './use-fleet-detail';
import {
  formatTripStamp,
  LocationDropdown,
  InsuranceDetailModal,
  INSURANCE_DETAILS,
} from './fleet-detail-shared';
import styles from '@/styles/template-2.module.css';

export default function FleetDetailClientT2({ carId }: { carId: string }) {
  const fd = useFleetDetail(carId);

  if (fd.status === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          <Dyn>{fd.isLoading ? 'Loading vehicle…' : 'Fetching insurance quotes…'}</Dyn>
        </p>
      </div>
    );
  }

  if (fd.status === 'not-found') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <a href={paths.fleet} className={styles.linkMore}><Dyn>Back to fleet</Dyn></a>
        <p style={{ color: 'var(--text-muted)' }}><Dyn>Vehicle not found.</Dyn></p>
      </div>
    );
  }

  const {
    t,
    embed,
    squareCardRef,
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
    tenant,
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
    <div className={styles.section} style={{ paddingTop: '1.4rem' }}>
      <div className={styles.container}>
        <div className={styles.detailTop}>
          <div>
            <h1>{vehicle.name}</h1>
            <p className={styles.detailPlate}><Dyn>Plate</Dyn> {vehicle.licensePlate}</p>
          </div>
          <div className={styles.detailRate}>
            <b>{money(vehicle.pricePerDay)}</b>
            <span><Dyn>per day</Dyn></span>
          </div>
        </div>

        <div className={styles.mobileSummary}>
          <img src={galleryImages[0]} alt={vehicle.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{vehicle.name}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{days} <Dyn>{days === 1 ? 'day' : 'days'}</Dyn></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{money(total)}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}><Dyn>Total</Dyn></div>
          </div>
        </div>

        <div className={styles.detailGrid}>
          <div>
            <div
              className={styles.galleryMain}
              onClick={() => {
                setGalleryIndex(0);
                setGalleryOpen(true);
              }}
            >
              {vehicle.vehicleType ? <span className={styles.galleryTag}>{vehicle.vehicleType}</span> : null}
              <img src={galleryImages[0]} alt={vehicle.name} />
              {photoCount > 1 ? (
                <span className={styles.galleryCount}>
                  <Dyn>View all</Dyn> {photoCount} <Dyn>photos</Dyn>
                </span>
              ) : null}
            </div>
            {photoCount > 1 ? (
              <div className={styles.galleryThumbs}>
                {galleryImages.slice(0, 5).map((src, i) => (
                  <div
                    key={i}
                    className={styles.galleryThumb}
                    onClick={() => {
                      setGalleryIndex(i);
                      setGalleryOpen(true);
                    }}
                  >
                    <img src={src} alt={`${vehicle.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.specGrid}>
              {[
                { label: 'Seats', value: vehicle.seats ? String(vehicle.seats) : '' },
                { label: 'Transmission', value: vehicle.transmission },
                { label: 'Fuel', value: vehicle.fuelType },
                { label: 'Year', value: vehicle.year ? String(vehicle.year) : '' },
                { label: 'Mileage', value: vehicle.milesPerDay ? `${vehicle.milesPerDay} mi/day` : 'Unlimited' },
              ]
                .filter((s) => s.value)
                .map(({ label, value }) => (
                  <div key={label} className={styles.specItem}>
                    <div>
                      <span><Dyn>{label}</Dyn></span>
                      <b>{value}</b>
                    </div>
                  </div>
                ))}
            </div>

            {vehicle.description ? (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}><Dyn>About this vehicle</Dyn></p>
                <div className={styles.description}>{vehicle.description}</div>
              </div>
            ) : null}

            <div className={styles.detailSection}>
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
            </div>

            {vehicle.extras.length > 0 ? (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}><Dyn>Add extras</Dyn></p>
                {vehicle.extras.map((x) => {
                  const count = extras[x.id] || 0;
                  const active = count > 0;
                  return (
                    <div key={x.id} className={`${styles.extraRow} ${active ? styles.extraRowActive : ''}`}>
                      <div className={styles.extraInfo}>
                        <b>{x.title}</b>
                        <p>{x.description}</p>
                        <em>{money(x.price)}{x.priceUnit}</em>
                      </div>
                      {active ? (
                        <div className={styles.extraStepper}>
                          <button type="button" onClick={() => setExtra(x.id, -1)}>−</button>
                          <span>{count}</span>
                          <button type="button" onClick={() => setExtra(x.id, 1)}>+</button>
                        </div>
                      ) : (
                        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.extraAdd}`} onClick={() => setExtra(x.id, 1)}>
                          <Dyn>Add</Dyn>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className={styles.detailSection}>
              <p className={styles.detailSectionTitle}><Dyn>Driver details</Dyn></p>
              <div className={styles.formGrid}>
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
                <div className={styles.paymentWrap}>
                  <SquareCardEntry
                    ref={squareCardRef}
                    applicationId={providersData.square.application_id}
                    locationId={providersData.square.location_id}
                    environment={(providersData.square.environment as 'sandbox' | 'production') || 'production'}
                    requiresDeposit={Number((vehicle as any)?.securityDeposit) > 0}
                    depositConsentCopy={
                      Number((vehicle as any)?.securityDeposit) > 0
                        ? buildDepositConsentCopy({
                            tenantName: tenant?.name,
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
                <div ref={paymentAnchorRef} className={styles.paymentWrap}>
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
                    tenantName={tenant?.name}
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
          </div>

          <div className={styles.priceCard}>
            <div
              className={styles.tripRow}
              onClick={() => setTripOpen(true)}
            >
              <div>
                <span><Dyn>Pick-up</Dyn></span>
                <b>{pickupCity} · {formatTripStamp(pickupDate, pickupTime)}</b>
              </div>
              <span className={styles.tripEdit}><Dyn>Edit</Dyn></span>
            </div>
            <div
              className={styles.tripRow}
              onClick={() => setTripOpen(true)}
            >
              <div>
                <span><Dyn>Drop-off</Dyn></span>
                <b>{dropoffCity} · {formatTripStamp(returnDate, returnTime)}</b>
              </div>
              <span className={styles.tripEdit}><Dyn>Edit</Dyn></span>
            </div>

            <div className={styles.priceHeadRow}>
              <h3><Dyn>Price details</Dyn></h3>
              <span className={styles.priceDayPill}>{days} <Dyn>days</Dyn></span>
            </div>

            <DateDealsCallout days={days} isPeakPricing={vehicle.isPeakPricing} isPromoPricing={vehicle.isPromoPricing} />

            <p className={styles.priceLabel}><Dyn>Rental</Dyn></p>
            <RentalBreakdown
              rateUnit={pricing.rateUnit}
              pricePerHour={vehicle.pricePerHour}
              rentalHours={rentalHours}
              pricePerDay={vehicle.pricePerDay}
              days={days}
              dailyRates={vehicle.dailyRates}
              total={pricing.subtotal - pricing.insuranceCost - pricing.extrasCost}
            />
            <div className={styles.priceDivider} />

            <p className={styles.priceLabel}>
              <span><Dyn>Insurance</Dyn>{insuranceLabel ? ` (${insuranceLabel})` : ''}</span>
              <button type="button" onClick={scrollProtection}><Dyn>Change</Dyn></button>
            </p>
            {selectedPlans.length > 0 || (selectedManualPackages?.length ?? 0) > 0 || (abiAvailable && abiOptedIn) ? (
              <>
                {selectedPlans.map((p) => (
                  <div key={`bonzah-${p.id}`} className={styles.priceLine}>
                    <span><Dyn>{p.title}</Dyn><br /><small>{money(p.price)} × {days} <Dyn>days</Dyn></small></span>
                    <b>{money(p.totalPrice ?? p.price * days)}</b>
                  </div>
                ))}
                {selectedManualPackages?.map((pkg) => (
                  <div key={`manual-${pkg.id}`} className={styles.priceLine}>
                    <span><Dyn>{pkg.title}</Dyn><br /><small>{money(pkg.dailyRate)} × {days} <Dyn>days</Dyn></small></span>
                    <b>{money(pkg.dailyRate * days)}</b>
                  </div>
                ))}
                {abiAvailable && abiOptedIn ? (
                  <div className={styles.priceLine}>
                    <span><Dyn>Rental Coverage</Dyn><br /><small>{money(Number(abiAvailable.daily_price))} × {abiAvailable.days} <Dyn>days</Dyn></small></span>
                    <b>{money(Number(abiAvailable.total_price))}</b>
                  </div>
                ) : null}
              </>
            ) : (
              <div className={styles.priceEmpty}>
                <span><Dyn>{ownSelected ? 'Own insurance' : 'No protection selected'}</Dyn></span>
                <span>{money(0)}</span>
              </div>
            )}
            <div className={styles.priceDivider} />

            <p className={styles.priceLabel}><Dyn>Add-ons</Dyn></p>
            {extraInvoiceItems.length > 0 ? (
              extraInvoiceItems.map((a) => (
                <div key={a.name} className={styles.priceLine}>
                  <span>{a.name}</span>
                  <b>{money(a.price)}</b>
                </div>
              ))
            ) : (
              <div className={styles.priceEmpty}>
                <span><Dyn>None added yet</Dyn></span>
                <span>$0.00</span>
              </div>
            )}
            <div className={styles.priceDivider} />

            <p className={styles.priceLabel}><Dyn>Discounts</Dyn></p>
            {pricing.fleetDiscount > 0 && pricing.fleetDiscountTier ? (
              <div className={styles.priceLine}>
                <span>
                  <Dyn>{pricing.fleetDiscountTier.unitType === 'week'
                    ? 'Weekly discount'
                    : pricing.fleetDiscountTier.unitType === 'hour'
                      ? 'Hourly discount'
                      : 'Long-rental discount'}</Dyn>{' '}
                  ({pricing.fleetDiscountTier.percentage}% <Dyn>OFF</Dyn>)
                </span>
                <b>−{money(pricing.fleetDiscount)}</b>
              </div>
            ) : null}
            {promoApplied ? (
              <>
                <div className={styles.priceLine} style={{ marginTop: pricing.fleetDiscount > 0 ? '0.55rem' : 0 }}>
                  <span className={styles.promoChip}>
                    {promoCode}
                    <button type="button" aria-label={t('Remove promo code')} onClick={() => setPromoApplied(false)}>✕</button>
                  </span>
                  <b>−{money(promoDiscount)}</b>
                </div>
                {promoAppliesTo.length > 0 ? (
                  <p style={{ marginTop: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <Dyn>Applied to</Dyn>: {promoAppliesTo.join(', ')}
                  </p>
                ) : null}
              </>
            ) : null}
            {!(pricing.fleetDiscount > 0 && pricing.fleetDiscountTier) && !promoApplied ? (
              <div className={styles.priceEmpty}>
                <span><Dyn>None applied</Dyn></span>
                <span>$0.00</span>
              </div>
            ) : null}
            <div className={styles.promoRow}>
              <input
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  setPromoError('');
                }}
                placeholder={t('Enter promo code')}
              />
              <button type="button" onClick={applyPromo}><Dyn>Apply</Dyn></button>
            </div>
            {promoError && <FieldError><Dyn>{promoError}</Dyn></FieldError>}
            <div className={styles.priceDivider} />

            <p className={styles.priceLabel}><Dyn>Charges &amp; taxes</Dyn></p>
            {pricing.locationCharges > 0 ? (
              <div className={styles.priceLine}><span><Dyn>Location charges</Dyn></span><b>{money(pricing.locationCharges)}</b></div>
            ) : null}
            {pricing.bookingFee > 0 ? (
              <div className={styles.priceLine}><span><Dyn>Booking fees</Dyn></span><b>{money(pricing.bookingFee)}</b></div>
            ) : null}
            <div className={styles.priceLine}><span><Dyn>Tax</Dyn></span><b>{money(pricing.tax)}</b></div>
            {pricing.deposit > 0 ? (
              <div className={styles.priceLine}>
                <span><Dyn>Security deposit</Dyn> <small><Dyn>(refundable)</Dyn></small></span>
                <b>{money(pricing.deposit)}</b>
              </div>
            ) : null}
            <div className={styles.priceDivider} />

            <div className={styles.totalRow}>
              <div>
                <span><Dyn>Total</Dyn></span>
                {promoApplied ? (
                  <div className={styles.totalSaving}><Dyn>You&apos;re saving</Dyn> {money(discount)}</div>
                ) : null}
              </div>
              <b>{money(total + (pricing.deposit || 0))}</b>
            </div>

            {pricing.deposit > 0 ? (
              <p style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <Dyn>Includes a refundable</Dyn> {money(pricing.deposit)} <Dyn>security deposit, refunded after your trip minus any damage claims.</Dyn>
              </p>
            ) : null}

            {!meetsMinDuration ? (
              <div className={`${styles.noticeBox} ${styles.noticeBoxDanger}`}>
                <Info size={14} strokeWidth={2} />
                <span><Dyn>This vehicle has a minimum rental of</Dyn> {minDuration} <Dyn>{minDuration === 1 ? 'day' : 'days'}</Dyn>. <Dyn>Choose a longer trip to continue.</Dyn></span>
              </div>
            ) : null}

            {(hasErrors || checkoutError) ? (
              <div ref={errorBannerRef} className={`${styles.noticeBox} ${styles.noticeBoxDanger}`}>
                <Info size={14} strokeWidth={2} />
                <span><Dyn>{checkoutError || 'Please fix the highlighted fields to continue.'}</Dyn></span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => reserve()}
              disabled={
                startCheckout.isPending ||
                startVerification.isPending ||
                startEmbedPayment.isPending ||
                !meetsMinDuration ||
                (rentalAgreementRequired && !rentalAgreementSigned)
              }
              className={`${styles.btn} ${styles.btnBrass} ${styles.reserveBtn}`}
            >
              <Dyn>{startCheckout.isPending || startVerification.isPending || startEmbedPayment.isPending
                ? 'Starting checkout…'
                : 'Reserve Now'}</Dyn>
            </button>

            {rentalAgreementRequired ? (
              <button
                type="button"
                onClick={() => setRentalAgreementModalOpen(true)}
                className={`${styles.agreementBtn} ${rentalAgreementSigned ? styles.agreementBtnSigned : ''}`}
              >
                <span>
                  <Dyn>{rentalAgreementSigned ? 'Rental Agreement signed' : 'Sign Rental Agreement · required'}</Dyn>
                </span>
                {rentalAgreementSigned ? <Check size={14} strokeWidth={2.4} /> : null}
              </button>
            ) : null}

            <div className={styles.trustRow}>
              {['No hidden fees, price you see is final', 'Encrypted, secure payment'].map((line) => (
                <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={13} strokeWidth={2} style={{ color: 'var(--brass)' }} />
                  <Dyn>{line}</Dyn>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {galleryOpen ? (
        <div
          onClick={() => setGalleryOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(12,14,12,0.92)',
            padding: '2rem',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 920 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                {vehicle.name} · {galleryIndex + 1} / {gallery.length}
              </span>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                style={{ background: 'rgba(255,255,255,0.12)', border: 0, borderRadius: '999px', width: 38, height: 38, color: '#fff', cursor: 'pointer' }}
              >
                <Close size={18} strokeWidth={2} />
              </button>
            </div>
            <div style={{ position: 'relative', aspectRatio: '16 / 10', width: '100%', borderRadius: 4, overflow: 'hidden', background: '#1c2228' }}>
              <img src={gallery[galleryIndex]} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => setGalleryIndex((i) => (i + gallery.length - 1) % gallery.length)}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '999px', background: 'rgba(255,255,255,0.92)', border: 0, cursor: 'pointer' }}
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setGalleryIndex((i) => (i + 1) % gallery.length)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '999px', background: 'rgba(255,255,255,0.92)', border: 0, cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailId ? (
        <InsuranceDetailModal
          option={plans.find((x) => x.id === detailId) ?? null}
          selected={selectedInsurance.has(detailId)}
          disabled={isInsuranceDisabled(detailId)}
          onToggle={() => toggleInsurance(detailId)}
          onClose={() => setDetailId(null)}
        />
      ) : null}

      <Dialog
        isOpen={tripOpen}
        onClose={() => setTripOpen(false)}
        labelledBy="trip-edit-title-t2"
        panelClassName="max-w-[460px] p-[26px] bg-[var(--card)] text-[var(--text)] border border-[var(--line)]"
      >
        <div className={styles.dialogHead}>
          <h3 id="trip-edit-title-t2"><Dyn>Edit your trip</Dyn></h3>
          <button type="button" aria-label={t('Close')} onClick={() => setTripOpen(false)} className={styles.dialogClose}>
            <Close size={20} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.dialogFields}>
          <div>
            <div className={styles.dialogFieldLabel}><Dyn>Pick-up location</Dyn></div>
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
            <div className={styles.dialogFieldLabel}><Dyn>Drop-off location</Dyn></div>
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
            <div className={styles.dialogFieldLabel}><Dyn>Pick-up date &amp; time</Dyn></div>
            <div className={styles.dialogFieldBox}>
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
            <div className={styles.dialogFieldLabel}><Dyn>Return date &amp; time</Dyn></div>
            <div className={styles.dialogFieldBox}>
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
        {tripError && <p className={styles.dialogError}>{tripError}</p>}
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
          className={`${styles.btn} ${styles.btnBrass} ${styles.reserveBtn}`}
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
