'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { BookingAuthorization, EndingPolicy, reserveLabel } from '@/components/booking/booking-authorization';
import { depositSummary, rateRows, taxRows, weeklySavingText } from '@/lib/price-rows';
import { ReturnModeToggle } from '@/components/booking/weekly-rental';
import { NmiPayModal } from '@/components/booking/nmi-pay-modal';
import { RentalAgreementSignModal } from '@/components/booking/rental-agreement-sign-modal';
import { EmbedPaymentPanel } from '@/components/checkout/embed-payment-panel';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { formatTripStamp, NotBookableOnline } from './fleet-detail-shared';
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
    checkoutError,
    errorBannerRef,
    protectionRef,
    galleryImages,
    photoCount,
    days,
    pricing,
    rates,
    weekly,
    cardDeposit,
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
    notBookableOnline,
    meetsMinDuration,
    tripProblem,
    minDuration,
    minDurationLabel,
    rentalAgreementRequired,
    rentalAgreementSigned,
    consentText,
    checkoutBusy,
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
    scrollProtection,
    insuranceLabel,
  } = fd;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const rateLines = rateRows(pricing);
  const savingText = weeklySavingText(pricing);
  const hero = galleryImages[0];
  const second = galleryImages[1];
  const third = galleryImages[2];

  const specs: [string, string | null][] = [
    ['Seats', vehicle.seats ? String(vehicle.seats) : ''],
    ['Transmission', vehicle.transmission],
    ['Fuel', vehicle.fuelType],
    ['Year', vehicle.year ? String(vehicle.year) : ''],
    ['Mileage', rates.mileage],
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
                <b>{money(rates.headline.price)}</b>
                <span>
                  <Dyn>{`per ${rates.headline.per}`}</Dyn>
                </span>
                {rates.extras ? <span>{rates.extras}</span> : null}
                {rates.weekly ? (
                  <span>
                    <Dyn>{rates.weekly.label}</Dyn>
                  </span>
                ) : null}
              </div>
            </div>

            {hero ? (
              <div className="gal">
                <div>
                  {vehicle.vehicleType ? <span className="tag">{vehicle.vehicleType}</span> : null}
                  <Image className="img" src={hero} alt={vehicle.name} width={900} height={600} priority unoptimized />
                </div>
                {second ? (
                  <div>
                    <Image className="img" src={second} alt="" width={460} height={300} loading="lazy" unoptimized />
                  </div>
                ) : null}
                {third ? (
                  <div>
                    <Image className="img" src={third} alt="" width={460} height={300} loading="lazy" unoptimized />
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

            {notBookableOnline ? null : (<>
            {weekly.on && weekly.cycles.length > 1 ? (
              <div className="blk" id="billing-terms">
                <h2>
                  <i />
                  <Dyn>Billing terms</Dyn>
                </h2>
                <p style={{ marginBottom: 16 }}>
                  <Dyn>{weekly.termsBlurb}</Dyn>
                </p>
                <div className="opts">
                  {weekly.cycles.map((option) => (
                    <Opt
                      key={option.value}
                      on={weekly.cycleValue === option.value}
                      title={option.label}
                      description={option.description}
                      amount={option.perWeek}
                      unit={option.saving}
                      pill={option.best ? 'Best rate' : undefined}
                      onToggle={() => weekly.setCycle(option.value as never)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {!weekly.on ? <div className="blk" id="protection">
              <h2 ref={protectionRef}>
                <i />
                <Dyn>Protection</Dyn>
              </h2>
              {/* `plans` already includes the "own insurance" option
                  (id 'own') from getInsuranceOptionsBundle — rendering
                  a second one here showed it twice. */}
              <div className="opts">
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
            </div> : null}

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
            </div>

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
                  depositAmount={cardDeposit.amount}
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
            </>)}
          </div>

          <aside className="sum">
            {notBookableOnline ? (
              <section>
                <NotBookableOnline body="note" contacts="note dark" action="btn reserve" />
              </section>
            ) : (<>
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
                    {dropoffCity} · {weekly.on ? <Dyn>No fixed return</Dyn> : formatTripStamp(returnDate, returnTime)}
                  </b>
                </div>
                <button type="button" onClick={() => setTripOpen(true)}>
                  <Dyn>Edit</Dyn> ✎
                </button>
              </div>
            </section>

            {(weekly.model || weekly.unavailable) && weekly.canPickDate ? (
              <section>
                <ReturnModeToggle weekly={weekly} variant="inherit" />
              </section>
            ) : null}

            <section>
              <h3>
                <Dyn>{weekly.on ? 'Each charge' : 'Price details'}</Dyn>
                <span className="daypill">
                  {weekly.on ? <Dyn>{weekly.cycle.badge}</Dyn> : <>{days} <Dyn>{days === 1 ? 'day' : 'days'}</Dyn></>}
                </span>
              </h3>
              {weekly.on ? (
                weekly.invoice ? (
                  weekly.invoice.groups.map((group) => (
                    <div key={group.key}>
                      <h5>
                        <Dyn>{group.heading}</Dyn>
                        {group.action === 'protection' ? (
                          <button type="button" onClick={scrollProtection}>
                            <Dyn>Change</Dyn>
                          </button>
                        ) : null}
                      </h5>
                      {group.lines.map((line) => (
                        <div className={line.muted ? 'ln mut' : 'ln'} key={line.key}>
                          <span>
                            <Dyn>{line.label}</Dyn>
                            {line.detail ? <small>{line.detail}</small> : null}
                          </span>
                          <span>
                            <Dyn>{line.amount}</Dyn>
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="note">
                    <Dyn>{weekly.reason ?? 'Working out your weekly price…'}</Dyn>
                  </p>
                )
              ) : (<>

              <h5>
                <Dyn>Rental</Dyn>
              </h5>
              <div className="ln">
                <span>
                  <Dyn>Car rental</Dyn>
                  {rateLines.length === 1 ? <small>{rateLines[0].label}</small> : null}
                </span>
                <span>{money(pricing.rentalTotal)}</span>
              </div>
              {rateLines.length > 1
                ? rateLines.map((row) => (
                    <div className="ln mut" key={row.key}>
                      <span>{row.label}</span>
                      <span>{money(row.amount)}</span>
                    </div>
                  ))
                : null}
              {savingText ? (
                <p className="note">
                  <Dyn>{savingText}</Dyn>
                </p>
              ) : null}

              <h5>
                <Dyn>Protection</Dyn>
                <button type="button" onClick={scrollProtection}>
                  <Dyn>Change</Dyn>
                </button>
              </h5>
              {pricing.insuranceCost > 0 ? (
                <div className="ln">
                  <span>{insuranceLabel}</span>
                  <span>{money(pricing.insuranceCost)}</span>
                </div>
              ) : (
                <div className="ln mut">
                  <span>
                    <Dyn>{ownSelected ? 'Own insurance' : 'No protection selected'}</Dyn>
                  </span>
                  <span>{money(0)}</span>
                </div>
              )}

              <h5>
                <Dyn>Add-ons</Dyn>
              </h5>
              {extraInvoiceItems.length > 0 ? (
                extraInvoiceItems.map((item) => (
                  <div className="ln" key={item.name}>
                    <span>{item.name}</span>
                    <span>{money(item.price)}</span>
                  </div>
                ))
              ) : (
                <div className="ln mut">
                  <span>
                    <Dyn>None added yet</Dyn>
                  </span>
                  <span>{money(0)}</span>
                </div>
              )}

              <h5>
                <Dyn>Discounts</Dyn>
              </h5>
              <div className="promo">
                <input
                  value={promoApplied ? promoCode : promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder={t('Enter promo code')}
                  aria-label={t('Promo code')}
                  disabled={promoApplied}
                />
                <button
                  type="button"
                  onClick={() => (promoApplied ? setPromoApplied(false) : applyPromo())}
                >
                  <Dyn>{promoApplied ? 'Remove' : 'Apply'}</Dyn>
                </button>
              </div>
              {promoError ? <p className="pmsg bad">{promoError}</p> : null}
              {discount > 0 ? (
                <div className="ln neg">
                  <span>
                    <Dyn>Discount</Dyn>
                  </span>
                  <span>−{money(discount)}</span>
                </div>
              ) : null}

              <h5>
                <Dyn>Charges &amp; taxes</Dyn>
              </h5>
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
              {taxRows(pricing).map((row) => (
                <div className="ln" key={row.key}>
                  <span>
                    <Dyn>{row.label}</Dyn>
                  </span>
                  <span>{money(row.amount)}</span>
                </div>
              ))}
              </>)}
            </section>

            {weekly.on && weekly.invoice ? (
              <section>
                <div className="total">
                  <span>
                    <Dyn>{weekly.invoice.cycleLabel}</Dyn>
                  </span>
                  <div>
                    <small>USD</small>
                    <b>{weekly.invoice.cycleTotal}</b>
                  </div>
                </div>
                <p className="note">
                  <Dyn>{weekly.invoice.note}</Dyn>
                </p>
                {weekly.invoice.dueLines.map((line) => (
                  <div className={line.key === 'due' ? 'ln due' : 'ln'} key={line.key}>
                    <span>
                      <Dyn>{line.label}</Dyn>
                      {line.detail ? <small>{line.detail}</small> : null}
                    </span>
                    <span>
                      <Dyn>{line.amount}</Dyn>
                    </span>
                  </div>
                ))}
              </section>
            ) : null}

            {weekly.on && weekly.invoice ? (
              <EndingPolicy heading={weekly.invoice.endingHeading} body={weekly.invoice.endingBody} />
            ) : null}

            {!weekly.on ? <section>
              <div className="total">
                <span>
                  <Dyn>Total</Dyn>
                </span>
                <div>
                  <small>USD</small>
                  <b>{money(total)}</b>
                </div>
              </div>
              <p className="note">
                <Dyn>Security deposit</Dyn>: <Dyn>{depositSummary(pricing.deposit, pricing.depositMode)}</Dyn>
              </p>
            </section> : null}

            <section className="sum-act">
              <BookingAuthorization
                consentText={consentText}
                agreementRequired={rentalAgreementRequired}
                agreementSigned={rentalAgreementSigned}
                headingClassName="tobk-h"
                countClassName="cnt"
              >
                <button
                  type="button"
                  className={rentalAgreementSigned ? 'tobk done' : 'tobk'}
                  onClick={() => setRentalAgreementModalOpen(true)}
                >
                  <span className="ck" />
                  <span className="t">
                    <Dyn>{rentalAgreementSigned ? 'Agreement signed' : 'Read & sign agreement'}</Dyn>
                  </span>
                  <span className="lk">
                    <Dyn>{rentalAgreementSigned ? 'View' : 'Open'}</Dyn>
                  </span>
                </button>
              </BookingAuthorization>

              {!weekly.on && !meetsMinDuration ? (
                <p className="note">
                  <Dyn>This vehicle has a minimum rental of</Dyn> <Dyn>{minDurationLabel}</Dyn>.
                </p>
              ) : null}
              {tripProblem ? (
                <p className="note">
                  <Dyn>{tripProblem}</Dyn>
                </p>
              ) : null}

              <button
                type="button"
                className="btn reserve"
                disabled={reserveBlocked || hasErrors}
                onClick={reserve}
              >
                <Dyn>
                  {reserveLabel({
                    agreementRequired: rentalAgreementRequired,
                    agreementSigned: rentalAgreementSigned,
                    busy: checkoutBusy,
                    label: weekly.on ? 'Book weekly plan' : 'Reserve now',
                  })}
                </Dyn>{' '}
                <span className="chev">›</span>
              </button>

              {checkoutError ? (
                <p className="pmsg bad" ref={errorBannerRef} role="alert">
                  {checkoutError}
                </p>
              ) : null}

              <ul className="ticks">
                <li>
                  <Dyn>No hidden fees, the price you see is final</Dyn>
                </li>
                <li>
                  <Dyn>
                    {weekly.on && weekly.invoice
                      ? weekly.invoice.insuranceTick
                      : 'Insurance options shown before you pay'}
                  </Dyn>
                </li>
                <li>
                  <Dyn>Encrypted, secure payment</Dyn>
                </li>
              </ul>
            </section>
            </>)}
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
