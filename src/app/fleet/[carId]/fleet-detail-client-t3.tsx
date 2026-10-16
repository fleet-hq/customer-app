'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { AgreementSignBar } from '@/components/booking/agreement-sign-bar';
import { CardConsent } from '@/components/booking/card-consent';
import { NmiPayModal } from '@/components/booking/nmi-pay-modal';
import { RentalAgreementSignModal } from '@/components/booking/rental-agreement-sign-modal';
import { EmbedPaymentPanel } from '@/components/checkout/embed-payment-panel';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { formatTripStamp } from './fleet-detail-shared';
import { useFleetDetail } from './use-fleet-detail';

/** Template-3 car detail.
 *
 *  This is the raw template's own layout and markup — `dt` two-column
 *  split, `gal` photo grid, `specs-card`, `blk` sections, `opts`
 *  option cards that invert to charcoal when chosen, an `lf` form
 *  whose labels sit inside the field, and the sticky dark `sum`
 *  sidebar. It deliberately does not reuse template 2's detail view:
 *  that one reads as a different site, which is the whole reason this
 *  template exists.
 *
 *  Every piece of behaviour still comes from useFleetDetail — the same
 *  hook template 2's view uses — so pricing, availability, protection,
 *  agreement signing and the payment handoff are identical and cannot
 *  drift between the two. */
export default function FleetDetailClientT3({ carId }: { carId: string }) {
  const fd = useFleetDetail(carId);

  // The hook returns a discriminated union; narrow before destructuring.
  if (fd.status === 'loading') {
    return (
      <main className="pg">
        <div className="wrap">
          <p className="count">
            <Dyn>{fd.isLoading ? 'Loading vehicle…' : 'Fetching insurance quotes…'}</Dyn>
          </p>
        </div>
      </main>
    );
  }

  if (fd.status === 'not-found') {
    return (
      <main className="pg">
        <div className="wrap">
          <Link className="crumb" href={paths.fleet}>
            ‹ <Dyn>Back to fleet</Dyn>
          </Link>
          <p className="count">
            <Dyn>Vehicle not found.</Dyn>
          </p>
        </div>
      </main>
    );
  }

  const {
    t,
    vehicle,
    tenant,
    plans,
    manualInsurancePackages,
    selectedInsurance,
    selectedManualIds,
    toggleInsurance,
    handleToggleManual,
    isInsuranceDisabled,
    recommendedPlanId,
    abiAvailable,
    abiOptedIn,
    handleToggleAbi,
    ownSelected,
    extras,
    setExtra,
    fields,
    errors,
    setField,
    blurField,
    cardConsent,
    setCardConsent,
    checkoutError,
    errorBannerRef,
    protectionRef,
    galleryImages,
    photoCount,
    days,
    pricing,
    total,
    discount,
    extraInvoiceItems,
    promoApplied,
    promoCode,
    promoInput,
    setPromoInput,
    promoError,
    setPromoApplied,
    applyPromo,
    pickupCity,
    dropoffCity,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    setTripOpen,
    reserve,
    reserveBlocked,
    meetsMinDuration,
    minDuration,
    rentalAgreementRequired,
    rentalAgreementSigned,
    rentalAgreementSignature,
    rentalAgreementModalOpen,
    setRentalAgreementModalOpen,
    agreementPreviewData,
    bonzahSelected,
    nmiConfig,
    nmiPay,
    closeNmiPay,
    nmiSubmitting,
    submitNmiPayment,
    nmiCardError,
    embed,
    embedIntent,
    setEmbedIntent,
    paymentAnchorRef,
    hasErrors,
  } = fd;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const hero = galleryImages[0];
  const second = galleryImages[1];
  const third = galleryImages[2];

  const specs: [string, string][] = [
    ['Seats', vehicle.seats ? String(vehicle.seats) : ''],
    ['Transmission', vehicle.transmission],
    ['Fuel', vehicle.fuelType],
    ['Year', vehicle.year ? String(vehicle.year) : ''],
    ['Mileage', vehicle.milesPerDay ? `${vehicle.milesPerDay} mi/day` : 'Unlimited'],
    ['Type', vehicle.vehicleType],
  ];

  /** One option card. The raw design puts the whole card in a label so
   *  the entire tile is the hit target, and inverts it when chosen. */
  function Opt({
    on,
    locked,
    title,
    description,
    amount,
    unit,
    pill,
    onToggle,
  }: {
    on: boolean;
    locked?: boolean;
    title: string;
    description?: string;
    amount: string;
    unit?: string;
    pill?: string;
    onToggle: () => void;
  }) {
    return (
      <label className={`opt${on ? ' on' : ''}${locked ? ' locked' : ''}`}>
        <input type="checkbox" checked={on} disabled={locked} onChange={onToggle} />
        <div className="top">
          <span className="ck" />
          <h3>
            <Dyn>{title}</Dyn>
          </h3>
          {pill ? <span className="pill">{pill}</span> : null}
        </div>
        {description ? (
          <p>
            <Dyn>{description}</Dyn>
          </p>
        ) : null}
        <div className="amt">
          <b>{amount}</b>
          {unit ? <small>{unit}</small> : null}
        </div>
      </label>
    );
  }

  return (
    <main className="pg">
      <div className="wrap">
        <Link className="crumb" href={paths.fleet}>
          ‹ <Dyn>Back to fleet</Dyn>
        </Link>

        <div className="dt">
          <div>
            <div className="dt-hd">
              <div>
                <h1>{vehicle.name}</h1>
                <div className="sub">
                  {[vehicle.vehicleType, vehicle.transmission, vehicle.fuelType]
                    .filter(Boolean)
                    .map((bit, i, all) => (
                      <span key={bit}>
                        <Dyn>{bit}</Dyn>
                        {i < all.length - 1 ? <span> · </span> : null}
                      </span>
                    ))}
                </div>
              </div>
              <div className="pr">
                <b>{money(Number(vehicle.pricePerDay) || 0)}</b>
                <span>
                  <Dyn>per day</Dyn>
                </span>
              </div>
            </div>

            {hero ? (
              <div className="gal">
                <div>
                  {vehicle.vehicleType ? <span className="tag">{vehicle.vehicleType}</span> : null}
                  <Image src={hero} alt={vehicle.name} width={900} height={600} priority unoptimized />
                </div>
                {second ? (
                  <div>
                    <Image src={second} alt="" width={460} height={300} loading="lazy" unoptimized />
                  </div>
                ) : null}
                {third ? (
                  <div>
                    <Image src={third} alt="" width={460} height={300} loading="lazy" unoptimized />
                    {photoCount > 3 ? (
                      <button type="button" className="all" onClick={() => fd.setGalleryOpen(true)}>
                        <Dyn>View all photos</Dyn>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="specs-card">
              {specs
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <div>
                      <span>
                        <Dyn>{label}</Dyn>
                      </span>
                      <b>
                        <Dyn>{value}</Dyn>
                      </b>
                    </div>
                  </div>
                ))}
            </div>

            {vehicle.description ? (
              <div className="blk">
                <h2>
                  <i />
                  <Dyn>About this vehicle</Dyn>
                </h2>
                <p>{vehicle.description}</p>
              </div>
            ) : null}

            <div className="blk" id="protection">
              <h2 ref={protectionRef}>
                <i />
                <Dyn>Protection</Dyn>
              </h2>
              <div className="opts">
                <Opt
                  on={ownSelected}
                  title="I have my own insurance"
                  description="Bring your own policy. No protection is added to this rental."
                  amount={money(0)}
                  onToggle={() => toggleInsurance('own')}
                />
                {plans.map((plan) => (
                  <Opt
                    key={plan.id}
                    on={selectedInsurance.has(plan.id)}
                    locked={isInsuranceDisabled(plan.id)}
                    title={plan.title}
                    description={plan.description}
                    amount={money(plan.price)}
                    unit="/ day"
                    pill={plan.id === recommendedPlanId ? t('Recommended') : undefined}
                    onToggle={() => toggleInsurance(plan.id)}
                  />
                ))}
                {(manualInsurancePackages ?? []).map((pkg) => (
                  <Opt
                    key={`m-${pkg.id}`}
                    on={selectedManualIds.has(pkg.id)}
                    locked={pkg.isMandatory}
                    title={pkg.title}
                    description={pkg.description}
                    amount={money(pkg.dailyRate)}
                    unit="/ day"
                    pill={pkg.isMandatory ? t('Included') : undefined}
                    onToggle={() => handleToggleManual(pkg.id)}
                  />
                ))}
                {abiAvailable ? (
                  <Opt
                    on={abiOptedIn}
                    title="Rental Coverage"
                    description="Per-day coverage for the length of this rental."
                    amount={money(Number(abiAvailable.daily_price))}
                    unit="/ day"
                    onToggle={() => handleToggleAbi(!abiOptedIn)}
                  />
                ) : null}
              </div>
            </div>

            {vehicle.extras.length > 0 ? (
              <div className="blk">
                <h2>
                  <i />
                  <Dyn>Add-ons</Dyn>
                </h2>
                <div className="opts">
                  {vehicle.extras.map((x) => {
                    const count = extras[x.id] || 0;
                    return (
                      <div key={x.id} className={`opt${count > 0 ? ' on' : ''}`}>
                        <div className="top">
                          <h3>{x.title}</h3>
                        </div>
                        {x.description ? <p>{x.description}</p> : null}
                        <div className="amt">
                          <b>
                            {money(x.price)}
                            {x.priceUnit}
                          </b>
                          <span className="stepper">
                            <button type="button" aria-label={t('Remove one')} onClick={() => setExtra(x.id, -1)}>
                              −
                            </button>
                            <span>{count}</span>
                            <button type="button" aria-label={t('Add one')} onClick={() => setExtra(x.id, 1)}>
                              +
                            </button>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="blk" id="driver">
              <h2>
                <i />
                <Dyn>Driver details</Dyn>
              </h2>
              <div className="lf">
                {([
                  ['firstName', 'First name', 'given-name', 'text'],
                  ['lastName', 'Last name', 'family-name', 'text'],
                  ['email', 'Email address', 'email', 'email'],
                  ['phone', 'Phone number', 'tel', 'tel'],
                ] as const).map(([key, label, autoComplete, type]) => (
                  <div className={`field${errors[key] ? ' bad' : ''}`} key={key}>
                    <label htmlFor={`t3-${key}`}>
                      <Dyn>{label}</Dyn>
                    </label>
                    <input
                      id={`t3-${key}`}
                      type={type}
                      autoComplete={autoComplete}
                      value={fields[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      onBlur={() => blurField(key)}
                    />
                    {errors[key] ? (
                      <span className="em">
                        <Dyn>{errors[key] as string}</Dyn>
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <CardConsent
                checked={cardConsent}
                onChange={setCardConsent}
                companyName={tenant.name}
                depositAmount={Number(vehicle?.securityDeposit) || 0}
              />
            </div>

            {rentalAgreementRequired ? (
              <AgreementSignBar
                signed={rentalAgreementSigned}
                onOpen={() => setRentalAgreementModalOpen(true)}
              />
            ) : null}

            {nmiPay ? (
              <NmiPayModal
                open={!!nmiPay}
                onClose={closeNmiPay}
                tokenizationKey={nmiConfig?.publishable_key || ''}
                amount={nmiPay?.amount ?? 0}
                currency={nmiPay?.currency ?? 'usd'}
                deposit={nmiPay?.deposit ?? 0}
                submitting={nmiSubmitting}
                error={nmiCardError}
                onSubmit={submitNmiPayment}
              />
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

          <aside className="sum">
            <section>
              <h3>
                <Dyn>Your trip</Dyn>
              </h3>
              <div className="leg">
                <div>
                  <span>
                    <Dyn>Pick-up</Dyn>
                  </span>
                  <b>
                    {pickupCity} · {formatTripStamp(pickupDate, pickupTime)}
                  </b>
                </div>
                <button type="button" onClick={() => setTripOpen(true)}>
                  <Dyn>Edit</Dyn> ✎
                </button>
              </div>
              <div className="leg">
                <div>
                  <span>
                    <Dyn>Drop-off</Dyn>
                  </span>
                  <b>
                    {dropoffCity} · {formatTripStamp(returnDate, returnTime)}
                  </b>
                </div>
                <button type="button" onClick={() => setTripOpen(true)}>
                  <Dyn>Edit</Dyn> ✎
                </button>
              </div>
            </section>

            <section>
              <h5>
                <Dyn>Price details</Dyn>
              </h5>
              <div className="ln">
                <span>
                  <Dyn>Car rental</Dyn>
                  <small>
                    {money(Number(vehicle.pricePerDay) || 0)} × {days}{' '}
                    <Dyn>{days === 1 ? 'day' : 'days'}</Dyn>
                  </small>
                </span>
                <span>{money(pricing.subtotal)}</span>
              </div>

              {pricing.insuranceCost > 0 ? (
                <div className="ln">
                  <span>
                    <Dyn>Protection</Dyn>
                  </span>
                  <span>{money(pricing.insuranceCost)}</span>
                </div>
              ) : null}

              {extraInvoiceItems.map((item) => (
                <div className="ln" key={item.name}>
                  <span>{item.name}</span>
                  <span>{money(item.price)}</span>
                </div>
              ))}

              {pricing.locationCharges > 0 ? (
                <div className="ln">
                  <span>
                    <Dyn>Location charges</Dyn>
                  </span>
                  <span>{money(pricing.locationCharges)}</span>
                </div>
              ) : null}

              {pricing.bookingFee > 0 ? (
                <div className="ln">
                  <span>
                    <Dyn>Booking fees</Dyn>
                  </span>
                  <span>{money(pricing.bookingFee)}</span>
                </div>
              ) : null}

              {pricing.tax > 0 ? (
                <div className="ln">
                  <span>
                    <Dyn>Tax</Dyn>
                  </span>
                  <span>{money(pricing.tax)}</span>
                </div>
              ) : null}

              {discount > 0 ? (
                <div className="ln neg">
                  <span>
                    <Dyn>Discount</Dyn>
                  </span>
                  <span>−{money(discount)}</span>
                </div>
              ) : null}

              <div className="promo">
                {promoApplied ? (
                  <div className="ln">
                    <span>{promoCode}</span>
                    <button type="button" onClick={() => setPromoApplied(false)}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder={t('Enter promo code')}
                      aria-label={t('Promo code')}
                    />
                    <button type="button" className="btn ghost promo-go" onClick={applyPromo}>
                      <Dyn>Apply</Dyn>
                    </button>
                  </>
                )}
                {promoError ? <p className="em">{promoError}</p> : null}
              </div>
            </section>

            <section>
              <div className="ln tot">
                <span>
                  <Dyn>Total</Dyn>
                </span>
                <b>{money(total)}</b>
              </div>

              {!meetsMinDuration ? (
                <p className="note">
                  <Dyn>This vehicle has a minimum rental of</Dyn> {minDuration}{' '}
                  <Dyn>days</Dyn>.
                </p>
              ) : null}

              {checkoutError ? (
                <p className="em" ref={errorBannerRef}>
                  {checkoutError}
                </p>
              ) : null}

              <button
                type="button"
                className="btn reserve"
                disabled={reserveBlocked || hasErrors}
                onClick={reserve}
              >
                <Dyn>Reserve now</Dyn> <span className="chev">›</span>
              </button>
            </section>
          </aside>
        </div>
      </div>

      <RentalAgreementSignModal
        open={rentalAgreementModalOpen}
        onClose={() => setRentalAgreementModalOpen(false)}
        initialSignature={rentalAgreementSignature}
        showBonzahAddendum={bonzahSelected}
        data={agreementPreviewData}
        onSigned={(dataUri: string) => {
          fd.setRentalAgreementSignature(dataUri);
          setRentalAgreementModalOpen(false);
        }}
      />
    </main>
  );
}
