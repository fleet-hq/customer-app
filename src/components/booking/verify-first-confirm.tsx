'use client';

import Link from 'next/link';
import { Check, Clock, Close, Download, IdCard, Pencil, ShieldCheck, Swap } from '@/components/ui/icons';
import { BackLink } from '@/components/ui/back-link';
import { cn, money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { insuranceCoverageLines } from '@/lib/insurance-lines';
import { paths } from '@/lib/paths';
import { TripPhotos } from '@/components/booking/side-panels';
import type { BookingDetails, BookingDriver, InsuranceVerificationDetails } from '@/services/bookingServices';
import type {
  ManualVerificationKind,
  ManualVerificationSubmission,
} from '@/services/manualVerificationServices';
import { ManualVerificationModal } from './manual-verification-modal';
import SecondaryDriverVerification from '@/components/booking/secondary-driver-verification';
import { FailedInsurancePanel } from '@/components/booking/failed-insurance-panel';
import { useState } from 'react';
import type { BillingChargeRow } from '@/services/billingServices';
import type { TripImage } from '@/services/tripImageServices';
import { useTenant } from '@/lib/tenant-context';
import { CardConsent } from '@/components/booking/card-consent';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

const FAILED_PILL_CLASSES = 'bg-[#FEF3F2] text-[#B42318]';
const FAILED_BUTTON_CLASSES = 'bg-[#FEF3F2] text-[#B42318] hover:bg-[#FEE4E2]';
const T2_FAILED_PILL_CLASSES =
  'bg-[color-mix(in_srgb,var(--danger)_16%,var(--card))] text-[var(--danger)]';
const T2_FAILED_BUTTON_CLASSES =
  'bg-[color-mix(in_srgb,var(--danger)_14%,var(--card))] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_22%,var(--card))]';

function useIsT2(): boolean {
  return useTenant().websiteTemplate === 'template_2';
}

function rentalDays(booking: BookingDetails): number {
  const start = new Date(booking.pickUp.rawDatetime).getTime();
  const end = new Date(booking.dropOff.rawDatetime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  const hours = Math.max(1, Math.ceil((end - start) / 3600000));
  return Math.max(1, Math.ceil(hours / 24));
}

function shortDate(iso: string, tz?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    ...(tz ? { timeZone: tz } : {}),
  });
}

function shortLocation(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(', ');
  return parts.slice(-2).join(', ');
}

export type BookingMode =
  | 'pending_verification'
  | 'payment_due'
  | 'confirmed_paid'
  | 'cancelled';

interface Props {
  booking: BookingDetails;
  backHref: string;
  mode: BookingMode;
  outstanding: number;
  charges: BillingChargeRow[];
  paymentPendingHref: string;
  holdCountdownLabel: string | null;
  holdExpired: boolean;
  idVerified: boolean;
  insuranceVerified: boolean;
  requireId: boolean;
  requireInsurance: boolean;
  insuranceBlocking: boolean;
  idPending: boolean;
  idError: string | null;
  idLinkSent: boolean;
  onIdVerify: () => void;
  insurancePending: boolean;
  insuranceError: string | null;
  insuranceLinkSent: boolean;
  insuranceFailed: boolean;
  insuranceFailureDetails: InsuranceVerificationDetails | null;
  onInsuranceVerify: () => void;
  allRequiredChecksDone: boolean;
  /** Agreement signed and card authorized — gates a plain payment. */
  consentChecksDone?: boolean;
  /** Settled booking that still needs a card: mints the $0 page. */
  onSaveCardOnly?: () => void;
  hasCardOnFile?: boolean;
  onPay: () => void;
  payLoading: boolean;
  payError: string | null;
  agreementSigned: boolean;
  agreementHref: string | null;
  /** Staff asked for a card; the renter authorizes it here before paying. */
  staffAskedForCard?: boolean;
  saveCard?: boolean;
  onChooseSaveCard?: (next: boolean) => void;
  companyName?: string;
  depositAmount?: number;
  /** Opens the signing modal instead of navigating away mid-payment. */
  onSignAgreement?: () => void;
  bookingId: string;
  token: string | null;
  secondaryDrivers: BookingDriver[];
  rentalStartDate: string;
  rentalEndDate: string;
  canModify: BookingDetails['canModify'];
  preTripPhotos: TripImage[];
  postTripPhotos: TripImage[];
  canUploadPhotos: boolean;
  isReserved: boolean;
  manualIdSubmission: ManualVerificationSubmission | null;
  manualInsuranceSubmission: ManualVerificationSubmission | null;
  onManualUploaded: () => void;
}

export function VerifyFirstConfirm(props: Props) {
  const isT2 = useIsT2();
  const {
    booking,
    backHref,
    mode,
    isReserved,
    manualIdSubmission,
    manualInsuranceSubmission,
    onManualUploaded,
    outstanding,
    charges,
    paymentPendingHref,
    holdCountdownLabel,
    holdExpired,
    idVerified,
    insuranceVerified,
    requireId,
    requireInsurance,
    insuranceBlocking,
    idPending,
    idError,
    idLinkSent,
    onIdVerify,
    insurancePending,
    insuranceError,
    insuranceLinkSent,
    insuranceFailed,
    insuranceFailureDetails,
    onInsuranceVerify,
    allRequiredChecksDone,
    consentChecksDone,
    onSaveCardOnly,
    hasCardOnFile,
    onPay,
    payLoading,
    payError,
    agreementSigned,
    agreementHref,
    staffAskedForCard,
    saveCard,
    onChooseSaveCard,
    companyName,
    depositAmount,
    onSignAgreement,
    bookingId,
    token,
    secondaryDrivers,
    rentalStartDate,
    rentalEndDate,
    canModify,
    preTripPhotos,
    postTripPhotos,
    canUploadPhotos,
  } = props;

  const days = rentalDays(booking);
  const inv = booking.invoice;
  const vehicleImage = booking.vehicle.image?.trim() || PLACEHOLDER_IMAGE;
  const startShort = [shortDate(booking.pickUp.rawDatetime, booking.timezone), booking.pickUp.time]
    .filter(Boolean)
    .join(', ');
  const endShort = [shortDate(booking.dropOff.rawDatetime, booking.timezone), booking.dropOff.time]
    .filter(Boolean)
    .join(', ');
  const pickupCityState = shortLocation(booking.pickUp.address);

  const requiredCount =
    (requireId ? 1 : 0) + (requireInsurance ? 1 : 0);
  const doneCount =
    (requireId && idVerified ? 1 : 0) + (requireInsurance && insuranceVerified ? 1 : 0);

  const totalDue = inv.total;
  // ``inv.rentalTotal`` is the source of truth (backend PricingService's
  // base_price). ``inv.items[].pricePerDay`` is already the per-day rate
  // and ``quantity`` is the day count, so multiplying them gives the
  // total — the older formula then multiplied by ``days`` a second time,
  // rendering "$total × N days = $total × N" (e.g. $50/day × 3 days
  // showed as $150 × 3 = $450).
  // Gross, because this summary lists the discount as its own
  // subtraction a few lines below. Using the net total showed the
  // discount twice: booking 794 read "$220.00 x 18 days" (the
  // discounted rate) and then "-$3,960.00", so the visible lines came
  // to $913.60 against a stated total of $4,873.60.
  const rentalLine =
    inv.rentalGross ||
    inv.rentalTotal ||
    inv.items.reduce(
      (sum, it) => sum + Number(it.pricePerDay || 0) * (it.quantity || 1),
      0,
    );
  const perDayRental = days > 0 ? rentalLine / days : 0;

  const lineItems: { label: string; sub?: string; value: number }[] = [];
  if (rentalLine > 0) {
    lineItems.push({
      label: 'Car rental',
      sub: `${money(perDayRental || rentalLine / Math.max(days, 1))} × ${days} day${days === 1 ? '' : 's'}`,
      value: rentalLine,
    });
  }
  const coverageLines = insuranceCoverageLines(inv.insuranceCoverages);
  if (coverageLines.length > 0) {
    for (const line of coverageLines) {
      lineItems.push({ label: line.label, sub: line.sub, value: line.amount });
    }
  } else if (inv.insurancePremium > 0) {
    lineItems.push({
      label: 'Standard Protection',
      sub: `${money(inv.insurancePremium / Math.max(days, 1))} × ${days} day${days === 1 ? '' : 's'}`,
      value: inv.insurancePremium,
    });
  }
  if (inv.abiPremium > 0) {
    lineItems.push({
      label: 'Rental Coverage',
      sub: `${money(inv.abiPremium / Math.max(days, 1))} × ${days} day${days === 1 ? '' : 's'}`,
      value: inv.abiPremium,
    });
  }
  for (const extra of inv.extras || []) {
    lineItems.push({
      label: extra.name,
      sub: `${money(extra.price / Math.max(days, 1))} × ${days} day${days === 1 ? '' : 's'}`,
      value: extra.price,
    });
  }
  if (inv.locationCharges > 0) {
    lineItems.push({ label: 'Location fees', value: inv.locationCharges });
  }
  if (inv.fees > 0) {
    lineItems.push({ label: 'Booking fee', value: inv.fees });
  }
  if (inv.tax > 0) {
    lineItems.push({ label: 'Taxes', value: inv.tax });
  }

  const outstandingId = requireId && !idVerified;
  const outstandingInsurance = insuranceBlocking && !insuranceVerified;
  const modeCopy = getModeCopy(mode, {
    email: booking.customer.email,
    outstanding,
    requireId,
    requireInsurance: insuranceBlocking,
    isReserved,
    outstandingId,
    outstandingInsurance,
  });

  return (
    <div className={cn(isT2 ? 'bg-[var(--paper)] text-[var(--text)]' : 'bg-white text-ink')}>
      <div className="mx-auto max-w-[1180px] px-4 pt-5 pb-16 sm:px-6">
        <BackLink href={backHref}><Dyn>{modeCopy.backLabel}</Dyn></BackLink>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                'text-[22px] leading-[1.2] font-semibold tracking-[-0.01em] sm:text-[28px]',
                isT2 ? 'text-[var(--text)]' : 'text-ink',
              )}
            >
              {modeCopy.title(booking.invoice.number)}
            </h1>
            <p
              className={cn(
                'mt-2 text-[12.5px] leading-[1.5] sm:text-[13.5px] sm:leading-[1.55]',
                isT2 ? 'text-[var(--text-muted)]' : 'text-muted',
              )}
            >
              {modeCopy.subtitle}
            </p>
          </div>
          {(mode === 'confirmed_paid' || mode === 'payment_due') && (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
              <BookingActionsRow
                bookingId={bookingId}
                token={token}
                canModify={canModify}
                verificationsComplete={idVerified}
              />
            </div>
          )}
        </div>

        <StateBanner
          mode={mode}
          holdCountdownLabel={holdCountdownLabel}
          holdExpired={holdExpired}
          email={booking.customer.email}
          outstanding={outstanding}
          requireId={requireId}
          requireInsurance={insuranceBlocking}
          isReserved={isReserved}
          outstandingId={outstandingId}
          outstandingInsurance={outstandingInsurance}
        />

        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="flex flex-col gap-6">
            <VehicleCard
              title={
                mode === 'pending_verification'
                  ? `Reservation hold · #${booking.invoice.number}`
                  : `Booking · #${booking.invoice.number}`
              }
              vehicleImage={vehicleImage}
              vehicleName={`${booking.vehicle.name} ${booking.vehicle.year}`}
              location={pickupCityState}
              dateRange={`${startShort} → ${endShort} · ${days} day${days === 1 ? '' : 's'}`}
            />

            {requiredCount > 0 && (
              <div
                className={cn(
                  'rounded-2xl border p-5',
                  isT2 ? 'rounded-[3px] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={cn('text-[16px] font-bold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
                      <Dyn>{doneCount === requiredCount
                        ? 'Verifications complete'
                        : 'Complete verification'}</Dyn>
                    </h3>
                    <p className={cn('mt-1 text-[12.5px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
                      <Dyn>{mode === 'pending_verification'
                        ? 'Both steps must be verified before you can pay and confirm.'
                        : doneCount === requiredCount
                          ? "You're fully verified for this rental."
                          : 'ID and insurance verification for this rental.'}</Dyn>
                    </p>
                  </div>
                  <p
                    className={cn(
                      'text-[12.5px] font-semibold',
                      isT2
                        ? doneCount === requiredCount ? 'text-[var(--success)]' : 'text-[var(--brass)]'
                        : doneCount === requiredCount ? 'text-success' : 'text-amber-text-2',
                    )}
                  >
                    {doneCount} <Dyn>of</Dyn> {requiredCount} <Dyn>verified</Dyn>
                  </p>
                </div>
                <div
                  className={cn(
                    'mt-4 h-1 overflow-hidden rounded-full',
                    isT2 ? 'bg-[var(--line)]' : 'bg-track',
                  )}
                >
                  <div
                    className={cn('h-full rounded-full transition-all', isT2 ? 'bg-[var(--success)]' : 'bg-success')}
                    style={{ width: `${(doneCount / requiredCount) * 100}%` }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {requireId && (
                    <VerifySubCard
                      icon={<IdCard size={18} className={isT2 ? 'text-[var(--text-muted)]' : 'text-muted'} />}
                      title="ID verification"
                      description="Add your driver's license details so we can confirm your identity."
                      verified={idVerified}
                      loading={idPending}
                      error={idError}
                      linkSent={idLinkSent}
                      onVerify={onIdVerify}
                      manualKind="id"
                      manualSubmission={manualIdSubmission}
                      onManualUploaded={onManualUploaded}
                      automatedLabel="Verify through Stripe"
                      automatedDescription="Scan your licence with Stripe Identity. Usually instant."
                    />
                  )}
                  {requireInsurance && (
                    <VerifySubCard
                      icon={<ShieldCheck size={18} className={isT2 ? 'text-[var(--text-muted)]' : 'text-muted'} />}
                      title="Insurance verification"
                      description="Add your coverage details or confirm the plan you selected."
                      verified={insuranceVerified}
                      loading={insurancePending}
                      error={insuranceError}
                      failed={insuranceFailed}
                      failureDetails={insuranceFailureDetails}
                      onVerify={onInsuranceVerify}
                      manualKind="insurance"
                      manualSubmission={manualInsuranceSubmission}
                      onManualUploaded={onManualUploaded}
                      automatedLabel="Verify through Modives"
                      automatedDescription="We look your policy up with your insurer automatically."
                    />
                  )}
                </div>
              </div>
            )}

            <SecondaryDriverVerification
              drivers={secondaryDrivers}
              bookingId={bookingId}
              rentalStartDate={rentalStartDate}
              rentalEndDate={rentalEndDate}
            />

            {mode === 'payment_due' && charges.length > 0 && (
              <OutstandingChargesCard
                charges={charges}
                paymentPendingHref={paymentPendingHref}
                booking={booking}
              />
            )}

            <AgreementCard
              signed={agreementSigned}
              href={agreementHref}
              mode={mode}
              onSign={onSignAgreement}
            />


            {mode !== 'cancelled' && (
              <TripPhotos
                bookingId={bookingId}
                canUpload={canUploadPhotos}
                note="Document the car before & after your trip to protect your deposit."
                groups={[
                  { title: 'Pre-trip', hint: 'Add before pickup', photos: preTripPhotos, imageType: 'pre_trip' },
                  { title: 'Post-trip', hint: 'Add at drop-off', photos: postTripPhotos, imageType: 'post_trip' },
                ]}
              />
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div
              className={cn(
                'rounded-2xl border p-5',
                isT2 ? 'rounded-[3px] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
              )}
            >
              <h3 className={cn('text-[16px] font-bold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
                <Dyn>Price summary</Dyn>
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                {lineItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-3 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className={isT2 ? 'text-[var(--text)]' : 'text-ink'}><Dyn>{item.label}</Dyn></p>
                      {item.sub && (
                        <p className={cn('mt-0.5 text-[11.5px]', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
                          {item.sub}
                        </p>
                      )}
                    </div>
                    <span className={cn('whitespace-nowrap font-medium', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
                      {money(item.value)}
                    </span>
                  </div>
                ))}
                {inv.discount > 0 && (
                  <div
                    className={cn(
                      'flex items-start justify-between gap-3 text-[13px]',
                      isT2 ? 'text-[var(--success)]' : 'text-success',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          <Dyn>{inv.discountCode ? 'Discount' : 'Discount applied'}</Dyn>
                        </span>
                        {inv.discountCode && (
                          <span
                            className={cn(
                              'rounded-md border px-1.5 py-[1px] text-[10.5px] font-bold uppercase tracking-[0.04em]',
                              isT2
                                ? 'border-[color-mix(in_srgb,var(--success)_45%,var(--line))] bg-[color-mix(in_srgb,var(--success)_14%,var(--card))] text-[var(--success)]'
                                : 'border-green-border-2 bg-green-bg text-success',
                            )}
                          >
                            {inv.discountCode}
                          </span>
                        )}
                      </div>
                      {inv.discountAppliesTo?.length > 0 && (
                        <p
                          className={cn(
                            'mt-[3px] text-[11px] font-normal',
                            isT2 ? 'text-[var(--text-muted)]' : 'text-faint',
                          )}
                        >
                          <Dyn>Applied to</Dyn>: {inv.discountAppliesTo.join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-[14px] font-bold">
                      −{money(inv.discount)}
                    </span>
                  </div>
                )}
                {inv.deposit > 0 && (
                  <div className="flex items-start justify-between gap-3 text-[13px]">
                    <p className={isT2 ? 'text-[var(--text)]' : 'text-ink'}>
                      <Dyn>Security deposit</Dyn>{' '}
                      <span className={cn('text-[11px]', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
                        <Dyn>(refundable)</Dyn>
                      </span>
                    </p>
                    <span className={cn('whitespace-nowrap font-medium', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
                      {money(inv.deposit)}
                    </span>
                  </div>
                )}
              </div>
              <div className={cn('my-5 h-px', isT2 ? 'bg-[var(--line)]' : 'bg-card-border')} />
              <div className="flex items-baseline justify-between">
                <span className={cn('text-[16px] font-bold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
                  <Dyn>{mode === 'confirmed_paid' ? 'Total paid' : 'Total due'}</Dyn>
                </span>
                <span>
                  <span className={cn('mr-1 text-[10px] font-semibold', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
                    USD
                  </span>
                  <span
                    className={cn(
                      'text-[22px] font-bold',
                      isT2
                        ? mode === 'confirmed_paid' ? 'text-[var(--success)]' : 'text-[var(--brass)]'
                        : mode === 'confirmed_paid' ? 'text-success' : 'text-secondary',
                    )}
                  >
                    {money(
                      mode === 'payment_due'
                        ? outstanding || totalDue
                        : totalDue + (inv.deposit || 0),
                    )}
                  </span>
                </span>
              </div>
              {inv.deposit > 0 && mode !== 'payment_due' && (
                <p className={cn('mt-2 text-[11px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
                  <Dyn>Includes a refundable</Dyn> {money(inv.deposit)} <Dyn>security deposit, refunded after your trip minus any damage claims.</Dyn>
                </p>
              )}

              {/* Sits directly above Pay: these are the two things the
                  renter is agreeing to, and reading them in one column
                  while the button lives in another is how people click
                  through without having done either. */}
              <PayGate
                needsAgreement={!agreementSigned && !!agreementHref}
                onSignAgreement={onSignAgreement}
                staffAskedForCard={!!staffAskedForCard}
                saveCard={!!saveCard}
                onChooseSaveCard={onChooseSaveCard}
                companyName={companyName ?? ''}
                depositAmount={depositAmount}
              />

              {mode === 'pending_verification' && (
                <PayCTA
                  onPay={onPay}
                  disabled={!allRequiredChecksDone || payLoading || holdExpired}
                  loading={payLoading}
                  label={
                    holdExpired
                      ? 'Hold expired'
                      : allRequiredChecksDone
                        ? 'Continue to pay'
                        : 'Complete verification to pay'
                  }
                  hint={
                    payError
                      ? payError
                      : !allRequiredChecksDone
                        ? 'Verify your ID and insurance to unlock payment.'
                        : null
                  }
                />
              )}

              {/* Sits directly above Pay: these are the two things the
                  renter is agreeing to, and reading them in one column
                  while the button lives in another is how people click
                  through without having done either. */}
              <PayGate
                needsAgreement={!agreementSigned && !!agreementHref}
                onSignAgreement={onSignAgreement}
                staffAskedForCard={!!staffAskedForCard}
                saveCard={!!saveCard}
                onChooseSaveCard={onChooseSaveCard}
                companyName={companyName ?? ''}
                depositAmount={depositAmount}
              />

              {mode === 'payment_due' && (
                <PayCTA
                  onPay={onPay}
                  disabled={consentChecksDone === false || payLoading}
                  loading={payLoading}
                  label={
                    consentChecksDone !== false
                      ? `Pay ${money(outstanding || totalDue)}`
                      : 'Complete the steps above to pay'
                  }
                  hint={
                    payError
                      ? payError
                      : consentChecksDone === false
                        ? 'Sign the agreement and authorize the card to continue.'
                        : null
                  }
                />
              )}

              {/* Paid, but staff asked for a card and none was kept —
                  usually a cash settlement or a payment taken before
                  anyone asked. Nothing to charge, so offer the $0 page. */}
              {mode === 'confirmed_paid' && staffAskedForCard && !hasCardOnFile ? (
                <div className="mt-4">
                  <CardConsent
                    checked={!!saveCard}
                    onChange={(next) => onChooseSaveCard?.(next)}
                    companyName={companyName ?? ''}
                    depositAmount={depositAmount}
                    required
                  />
                  <PayCTA
                    onPay={() => onSaveCardOnly?.()}
                    disabled={!saveCard}
                    loading={false}
                    label="Save my card"
                    hint={
                      saveCard
                        ? 'You will not be charged — this only stores your card for tolls, tickets or damage.'
                        : 'Authorize above to save your card.'
                    }
                  />
                </div>
              ) : null}

              {mode === 'confirmed_paid' && (
                <div
                  className={cn(
                    'mt-4 flex items-center justify-center gap-2 rounded-[10px] py-3 text-[13px] font-semibold',
                    isT2
                      ? 'bg-[color-mix(in_srgb,var(--success)_14%,var(--card))] text-[var(--success)]'
                      : 'bg-green-bg-2 text-success',
                  )}
                >
                  <Check size={14} strokeWidth={3} /> <Dyn>Paid</Dyn>
                </div>
              )}

              {mode === 'cancelled' && (
                <div
                  className={cn(
                    'mt-4 rounded-[10px] py-3 text-center text-[13px] font-semibold',
                    isT2 ? 'bg-[var(--line)] text-[var(--text-muted)]' : 'bg-chip text-muted',
                  )}
                >
                  <Dyn>Booking cancelled</Dyn>
                </div>
              )}

              <ul className={cn('mt-5 space-y-2 text-[12px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
                <TrustRow>
                  <Dyn>{mode === 'confirmed_paid'
                    ? 'Confirmation emailed'
                    : mode === 'cancelled'
                      ? 'Refunds follow the operator policy'
                      : 'No charge until you confirm'}</Dyn>
                </TrustRow>
                <TrustRow><Dyn>Free cancellation up to 48h</Dyn></TrustRow>
                <TrustRow><Dyn>Encrypted, secure payment</Dyn></TrustRow>
              </ul>

              <button
                type="button"
                onClick={() => window.print()}
                className={cn(
                  'mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] border py-2.5 text-[12.5px] font-medium',
                  isT2
                    ? 'border-[var(--line-strong)] text-[var(--text)] hover:bg-[var(--paper)]'
                    : 'border-line text-ink hover:bg-subtle',
                )}
              >
                <Download size={14} /> <Dyn>Download invoice</Dyn>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const bookingTitle = (num: string) => (
  <>
    <Dyn>Booking</Dyn> #{num}
  </>
);

function getModeCopy(
  mode: BookingMode,
  ctx: {
    email: string;
    outstanding: number;
    requireId: boolean;
    requireInsurance: boolean;
    isReserved: boolean;
    outstandingId: boolean;
    outstandingInsurance: boolean;
  },
): { backLabel: string; title: (num: string) => React.ReactNode; subtitle: React.ReactNode } {
  if (mode === 'pending_verification') {
    const verificationLabel = verificationTaskLabel(ctx.requireId, ctx.requireInsurance);
    const subtitle = verificationLabel ? (
      <>
        <Dyn>We&apos;re holding this vehicle for you. Complete</Dyn> <Dyn>{verificationLabel}</Dyn>{' '}
        <Dyn>below, then pay to lock in your reservation, you&apos;re not charged until you confirm.</Dyn>
      </>
    ) : (
      <Dyn>We&apos;re holding this vehicle for you. Complete payment below to lock in your reservation.</Dyn>
    );
    return {
      backLabel: 'Back to checkout',
      title: () => <Dyn>Confirm your booking</Dyn>,
      subtitle,
    };
  }
  if (mode === 'payment_due') {
    return {
      backLabel: 'Back to home',
      title: bookingTitle,
      subtitle: (
        <>
          <Dyn>You have additional charges of</Dyn> {money(ctx.outstanding)}{' '}
          <Dyn>pending on this booking.</Dyn>
        </>
      ),
    };
  }
  if (mode === 'cancelled') {
    return {
      backLabel: 'Back to home',
      title: bookingTitle,
      subtitle: <Dyn>This booking was cancelled. Any refund will follow the operator policy.</Dyn>,
    };
  }
  if (ctx.isReserved) {
    const label = verificationTaskLabel(ctx.outstandingId, ctx.outstandingInsurance);
    return {
      backLabel: 'Back to home',
      title: bookingTitle,
      subtitle: label ? (
        <>
          <Dyn>Your booking is reserved and your vehicle is held. Complete</Dyn>{' '}
          <Dyn>{label}</Dyn> <Dyn>below to confirm it. We emailed the details to</Dyn> {ctx.email}.
        </>
      ) : (
        <>
          <Dyn>Your booking is reserved and your vehicle is held. We emailed the details to</Dyn>{' '}
          {ctx.email}.
        </>
      ),
    };
  }
  return {
    backLabel: 'Back to home',
    title: bookingTitle,
    subtitle: (
      <>
        <Dyn>Your booking is confirmed. A copy of the confirmation was emailed to</Dyn> {ctx.email}.
      </>
    ),
  };
}

function verificationTaskLabel(requireId: boolean, requireInsurance: boolean): string {
  if (requireId && requireInsurance) return 'both verifications';
  if (requireId) return 'ID verification';
  if (requireInsurance) return 'insurance verification';
  return '';
}

function StateBanner({
  mode,
  holdCountdownLabel,
  holdExpired,
  email,
  outstanding,
  requireId,
  requireInsurance,
  isReserved,
  outstandingId,
  outstandingInsurance,
}: {
  mode: BookingMode;
  holdCountdownLabel: string | null;
  holdExpired: boolean;
  email: string;
  outstanding: number;
  requireId: boolean;
  requireInsurance: boolean;
  isReserved: boolean;
  outstandingId: boolean;
  outstandingInsurance: boolean;
}) {
  const isT2 = useIsT2();
  const t2Banner = 'rounded-[3px] border-[var(--line-strong)] bg-[var(--card)]';
  const t2IconCircle = 'bg-[var(--paper)]';

  if (mode === 'pending_verification') {
    return (
      <div
        className={cn(
          'mt-6 flex items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5',
          isT2 ? t2Banner : 'border-amber-border bg-amber-bg',
        )}
      >
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', isT2 ? t2IconCircle : 'bg-white')}>
          <Clock size={20} className={isT2 ? 'text-[var(--brass)]' : 'text-amber-text'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[14px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-amber-text')}>
            <Dyn>{holdExpired ? 'This hold has expired' : "We're holding your vehicle"}</Dyn>
          </p>
          <p className={cn('mt-0.5 text-[12.5px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-amber-text-2')}>
            <Dyn>{holdExpired
              ? 'Please start a new booking — this vehicle is no longer being held for you.'
              : verificationTaskLabel(requireId, requireInsurance)
                ? `Complete ${verificationTaskLabel(requireId, requireInsurance)} and pay before the timer runs out to confirm your booking.`
                : 'Complete payment before the timer runs out to confirm your booking.'}</Dyn>
          </p>
        </div>
        {holdCountdownLabel && (
          <div className="flex-shrink-0 text-right">
            <p className={cn('text-[10px] font-semibold uppercase tracking-[0.08em]', isT2 ? 'text-[var(--text-muted)]' : 'text-amber-text-2')}>
              <Dyn>Time left</Dyn>
            </p>
            <p className={cn('mt-0.5 font-inter text-[22px] font-bold tabular-nums', isT2 ? 'text-[var(--brass)]' : 'text-amber-text-2')}>
              {holdCountdownLabel}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'payment_due') {
    return (
      <div
        className={cn(
          'mt-6 flex items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5',
          isT2 ? t2Banner : 'border-amber-border bg-amber-bg',
        )}
      >
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', isT2 ? t2IconCircle : 'bg-white')}>
          <Clock size={20} className={isT2 ? 'text-[var(--brass)]' : 'text-amber-text'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[14px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-amber-text')}>
            <Dyn>Additional payment due</Dyn>
          </p>
          <p className={cn('mt-0.5 text-[12.5px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-amber-text-2')}>
            {money(outstanding)} <Dyn>needs to be paid to keep this booking active.</Dyn>
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'cancelled') {
    return (
      <div
        className={cn(
          'mt-6 flex items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5',
          isT2 ? t2Banner : 'border-danger-border bg-danger-bg',
        )}
      >
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', isT2 ? t2IconCircle : 'bg-white')}>
          <Close size={20} className={isT2 ? 'text-[var(--danger)]' : 'text-danger'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[14px] font-semibold', isT2 ? 'text-[var(--danger)]' : 'text-danger-text')}>
            <Dyn>Booking cancelled</Dyn>
          </p>
          <p className={cn('mt-0.5 text-[12.5px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-danger-soft')}>
            <Dyn>Any refund will follow the operator&apos;s cancellation policy.</Dyn>
          </p>
        </div>
      </div>
    );
  }

  if (isReserved) {
    const label = verificationTaskLabel(outstandingId, outstandingInsurance);
    return (
      <div
        className={cn(
          'mt-6 flex items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5',
          isT2 ? t2Banner : 'border-info-border bg-info-bg',
        )}
      >
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', isT2 ? t2IconCircle : 'bg-white')}>
          <Clock size={20} className={isT2 ? 'text-[var(--brass)]' : 'text-info-text'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[14px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-info-text')}>
            <Dyn>Your booking is reserved</Dyn>
          </p>
          <p className={cn('mt-0.5 text-[12.5px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
            {label ? (
              <>
                <Dyn>We emailed the details to</Dyn> {email}. <Dyn>Complete</Dyn> <Dyn>{label}</Dyn>{' '}
                <Dyn>below and your booking is confirmed automatically.</Dyn>
              </>
            ) : (
              <>
                <Dyn>We emailed the details to</Dyn> {email}.{' '}
                <Dyn>Your booking will be confirmed once your verifications are reviewed.</Dyn>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mt-6 flex items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5',
        isT2 ? t2Banner : 'border-green-border bg-green-bg',
      )}
    >
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', isT2 ? t2IconCircle : 'bg-white')}>
        <Check size={20} strokeWidth={3} className={isT2 ? 'text-[var(--success)]' : 'text-success'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[14px] font-semibold', isT2 ? 'text-[var(--success)]' : 'text-success')}>
          <Dyn>Your booking is confirmed</Dyn>
        </p>
        <p className={cn('mt-0.5 text-[12.5px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
          <Dyn>A confirmation was emailed to</Dyn> {email}. <Dyn>Please arrive at pickup with a valid license and the payment card on file.</Dyn>
        </p>
      </div>
    </div>
  );
}

function VehicleCard({
  title,
  vehicleImage,
  vehicleName,
  location,
  dateRange,
}: {
  title: string;
  vehicleImage: string;
  vehicleName: string;
  location: string;
  dateRange: string;
}) {
  const isT2 = useIsT2();
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 sm:p-5',
        isT2 ? 'rounded-[3px] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn('h-[70px] w-[110px] flex-shrink-0 rounded-lg bg-cover bg-center', isT2 ? 'bg-[var(--paper)]' : 'bg-chip')}
          style={{ backgroundImage: `url(${vehicleImage})` }}
        />
        <div className="min-w-0">
          <p className={cn('text-[11.5px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>{title}</p>
          <h3 className={cn('mt-1 text-[18px] font-bold', isT2 ? 'text-[var(--text)]' : 'text-secondary')}>{vehicleName}</h3>
          <p className={cn('mt-1 text-[12.5px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
            {location && <>{location} · </>}
            {dateRange}
          </p>
        </div>
      </div>
    </div>
  );
}

function OutstandingChargesCard({
  charges,
  paymentPendingHref,
  booking,
}: {
  charges: BillingChargeRow[];
  paymentPendingHref: string;
  /** Lets the booking's own charge say what it covers — the vehicle, the
   *  dates and the breakdown — rather than a bare "Booking total". */
  booking: BookingDetails;
}) {
  const isT2 = useIsT2();
  const pending = charges.filter(
    (c) => c.status !== 'paid' && c.status !== 'refunded' && !c.is_voided,
  );
  if (pending.length === 0) return null;
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 sm:p-5',
        isT2 ? 'rounded-[3px] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className={cn('text-[15px] font-bold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
          <Dyn>Additional charges</Dyn>
        </h3>
        <a
          href={paymentPendingHref}
          className={cn('text-[12.5px] font-semibold underline', isT2 ? 'text-[var(--brass)]' : 'text-primary')}
        >
          <Dyn>View details</Dyn>
        </a>
      </div>
      <ul className="mt-3 space-y-2 text-[13px]">
        {pending.map((c) => {
          // The booking's own charge is the one a renter cannot check: a
          // single total with no statement of what it covers. Name the
          // vehicle and dates, and show the same lines the invoice does.
          const isBookingFee = c.type === 'booking_fee';
          const inv = booking.invoice;
          const lines: [string, number][] = [];
          if (isBookingFee) {
            if (inv.rentalTotal > 0) lines.push(['Rental', inv.rentalTotal]);
            if (inv.fees > 0) lines.push(['Fees', inv.fees]);
            if (inv.discount > 0) lines.push(['Discount', -inv.discount]);
            if (inv.tax > 0) lines.push(['Tax', inv.tax]);
            if (inv.deposit > 0) lines.push(['Security deposit', inv.deposit]);
          }
          return (
            <li key={c.id}>
              <div className="flex items-center justify-between gap-3">
                <span className={isT2 ? 'text-[var(--text)]' : 'text-ink'}>
                  {isBookingFee ? booking.vehicle.name : c.description || c.type}
                </span>
                <span className={cn('whitespace-nowrap font-medium', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
                  {money(Number(c.amount || 0))}
                </span>
              </div>
              {isBookingFee ? (
                <p className={cn('mt-0.5 text-[12px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
                  {booking.pickUp.date} – {booking.dropOff.date}
                </p>
              ) : null}
              {lines.length > 0 ? (
                <div
                  className={cn(
                    'mt-2 space-y-1 border-t pt-2',
                    isT2 ? 'border-[var(--line)]' : 'border-card-border',
                  )}
                >
                  {lines.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3">
                      <span className={cn('text-[11.5px]', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
                        <Dyn>{label}</Dyn>
                      </span>
                      <span className={cn('text-[11.5px] tabular-nums', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
                        {money(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The two things a renter agrees to, directly above the Pay button.
 *
 *  The agreement opens the same signing modal used at checkout rather
 *  than linking away mid-payment, and the card authorization sits under
 *  it. Both feed the same gate the button is disabled by, so the page
 *  cannot offer to take money for terms nobody has accepted. */
function PayGate({
  needsAgreement,
  onSignAgreement,
  staffAskedForCard,
  saveCard,
  onChooseSaveCard,
  companyName,
  depositAmount,
}: {
  needsAgreement: boolean;
  onSignAgreement?: () => void;
  staffAskedForCard: boolean;
  saveCard: boolean;
  onChooseSaveCard?: (next: boolean) => void;
  companyName: string;
  depositAmount?: number;
}) {
  const isT2 = useIsT2();
  if (!needsAgreement && !staffAskedForCard) return null;
  return (
    <div className="mt-4">
      {needsAgreement ? (
        <button
          type="button"
          onClick={onSignAgreement}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-colors',
            isT2
              ? 'border-[var(--line-strong)] bg-[var(--card)] hover:border-[var(--brass)]'
              : 'border-line bg-white hover:border-primary',
          )}
        >
          <span className="min-w-0">
            <span className={cn('block text-[12.5px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
              <Dyn>Sign the rental agreement</Dyn>
              <span className="ml-0.5 text-danger">*</span>
            </span>
            <span className={cn('mt-0.5 block text-[11px]', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
              <Dyn>Required before payment</Dyn>
            </span>
          </span>
          <span className={cn('shrink-0 text-[12px] font-semibold', isT2 ? 'text-[var(--brass)]' : 'text-primary')}>
            <Dyn>Review &amp; sign</Dyn>
          </span>
        </button>
      ) : null}

      {staffAskedForCard ? (
        <CardConsent
          checked={saveCard}
          onChange={(next) => onChooseSaveCard?.(next)}
          companyName={companyName}
          depositAmount={depositAmount}
          required
        />
      ) : null}
    </div>
  );
}

function PayCTA({
  onPay,
  disabled,
  loading,
  label,
  hint,
}: {
  onPay: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  hint: string | null;
}) {
  const isT2 = useIsT2();
  return (
    <>
      <button
        type="button"
        onClick={onPay}
        disabled={disabled}
        className={cn(
          'mt-4 w-full rounded-[10px] py-3 text-center text-[13.5px] font-semibold transition-colors',
          isT2
            ? disabled
              ? 'cursor-not-allowed bg-[var(--line)] text-[var(--text-muted)]'
              : 'bg-[var(--brass)] text-[var(--on-brass)] hover:opacity-90'
            : disabled
              ? 'cursor-not-allowed bg-track text-muted'
              : 'bg-primary text-white hover:bg-primary-hover',
        )}
      >
        <Dyn>{loading ? 'Redirecting…' : label}</Dyn>
      </button>
      {hint && (
        <p className={cn('mt-3 flex items-start gap-2 text-[12px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
          <span
            className={cn(
              'mt-[1px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[10px] leading-none',
              isT2 ? 'border-[var(--line-strong)] text-[var(--text-muted)]' : 'border-line text-faint',
            )}
          >
            i
          </span>
          <span><Dyn>{hint}</Dyn></span>
        </p>
      )}
    </>
  );
}

function AgreementCard({
  signed,
  href,
  mode,
  onSign,
}: {
  signed: boolean;
  href: string | null;
  mode: BookingMode;
  /** Opens the signing modal in place. Falls back to the link when the
   *  caller has no modal — the agreement pages still link out. */
  onSign?: () => void;
}) {
  const isT2 = useIsT2();
  if (!href && !signed) return null;
  const primary = signed ? 'View agreement' : 'Sign now';
  return (
    <div
      className={cn(
        'rounded-2xl border p-5',
        isT2 ? 'rounded-[3px] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
              isT2
                ? signed
                  ? 'bg-[color-mix(in_srgb,var(--success)_16%,var(--card))] text-[var(--success)]'
                  : 'bg-[var(--paper)] text-[var(--text-muted)]'
                : signed
                  ? 'bg-green-bg-2 text-success'
                  : 'bg-chip text-muted',
            )}
          >
            {signed ? <Check size={16} strokeWidth={3} /> : <Pencil size={14} strokeWidth={2.5} />}
          </div>
          <div>
            <p className={cn('text-[14px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
              <Dyn>Rental agreement</Dyn>
            </p>
            <p className={cn('mt-0.5 text-[12px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
              <Dyn>{signed
                ? 'Signed. A copy is attached to this booking.'
                : mode === 'pending_verification'
                  ? 'Review and sign before pickup — it takes about a minute.'
                  : 'Review and sign to complete your paperwork.'}</Dyn>
            </p>
          </div>
        </div>
        {href && (() => {
          const actionClass = cn(
              'inline-flex flex-shrink-0 items-center justify-center rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-colors',
              isT2
                ? signed
                  ? 'border border-[var(--line-strong)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--paper)]'
                  : 'bg-[var(--brass)] text-[var(--on-brass)] hover:opacity-90'
                : signed
                  ? 'border border-line bg-white text-ink hover:bg-subtle'
                  : 'bg-primary text-white hover:bg-primary-hover',
          );
          // Signing in place keeps the renter on the page they are paying
          // from; without a handler we still link out, which is what the
          // standalone agreement pages do.
          return !signed && onSign ? (
            <button type="button" onClick={onSign} className={actionClass}>
              <Dyn>{primary}</Dyn>
            </button>
          ) : (
            <Link href={href} className={actionClass}>
              <Dyn>{primary}</Dyn>
            </Link>
          );
        })()}
      </div>
    </div>
  );
}

function BookingActionsRow({
  bookingId,
  token,
  canModify,
  verificationsComplete,
}: {
  bookingId: string;
  token: string | null;
  canModify: BookingDetails['canModify'];
  verificationsComplete: boolean;
}) {
  const isT2 = useIsT2();
  const withToken = (href: string) =>
    token ? `${href}?token=${encodeURIComponent(token)}` : href;
  void verificationsComplete;
  const canEdit = !!(canModify?.extend || canModify?.reduce);
  const canSwap = !!canModify?.swap;
  const canCancel = !!canModify?.cancel;

  const btn = isT2
    ? 'inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--line-strong)] bg-[var(--card)] px-3 py-2 text-[12.5px] font-medium text-[var(--text)] hover:bg-[var(--paper)] transition-colors'
    : 'inline-flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-3 py-2 text-[12.5px] font-medium text-ink hover:bg-subtle transition-colors';
  const btnDisabled = isT2
    ? 'inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--line-strong)] bg-[var(--card)] px-3 py-2 text-[12.5px] font-medium text-[var(--text-muted)] opacity-60 cursor-not-allowed'
    : 'inline-flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-3 py-2 text-[12.5px] font-medium text-faint opacity-60 cursor-not-allowed';

  const Action = ({
    label,
    icon,
    href,
    enabled,
  }: {
    label: string;
    icon: React.ReactNode;
    href: string;
    enabled: boolean;
  }) =>
    enabled ? (
      <Link href={withToken(href)} className={btn}>
        {icon} <Dyn>{label}</Dyn>
      </Link>
    ) : (
      <button type="button" disabled className={btnDisabled}>
        {icon} <Dyn>{label}</Dyn>
      </button>
    );

  const enabledIconCls = isT2 ? 'text-[var(--brass)]' : 'text-primary';
  const disabledIconCls = isT2 ? 'text-[var(--text-muted)]' : 'text-faint';
  const dangerIconCls = isT2 ? 'text-[var(--danger)]' : 'text-danger';

  return (
    <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
      <Action
        label="Modify"
        icon={<Pencil size={13} className={canEdit ? enabledIconCls : disabledIconCls} />}
        href={paths.modify(bookingId)}
        enabled={canEdit}
      />
      <Action
        label="Change vehicle"
        icon={<Swap size={13} className={canSwap ? enabledIconCls : disabledIconCls} />}
        href={paths.swap(bookingId)}
        enabled={canSwap}
      />
      <Action
        label="Cancel"
        icon={<Close size={13} strokeWidth={2} className={canCancel ? dangerIconCls : disabledIconCls} />}
        href={paths.cancel(bookingId)}
        enabled={canCancel}
      />
    </div>
  );
}

function TrustRow({ children }: { children: React.ReactNode }) {
  const isT2 = useIsT2();
  return (
    <li className="flex items-center gap-2">
      <Check size={13} strokeWidth={3} className={isT2 ? 'text-[var(--success)]' : 'text-success'} />
      <span>{children}</span>
    </li>
  );
}

function VerifySubCard({
  icon,
  title,
  description,
  verified,
  loading,
  error,
  linkSent,
  failed,
  failureDetails,
  onVerify,
  manualKind,
  manualSubmission,
  onManualUploaded,
  automatedLabel,
  automatedDescription,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  verified: boolean;
  loading: boolean;
  error: string | null;
  linkSent?: boolean;
  failed?: boolean;
  failureDetails?: InsuranceVerificationDetails | null;
  onVerify: () => void;
  manualKind: ManualVerificationKind;
  manualSubmission: ManualVerificationSubmission | null;
  onManualUploaded: () => void;
  automatedLabel: string;
  automatedDescription: string;
}) {
  const isT2 = useIsT2();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);

  const underReview = !verified && manualSubmission?.status === 'pending_review';
  const manualRejected = !verified && manualSubmission?.status === 'rejected';

  const label = underReview
    ? 'Under review'
    : failed
      ? detailsOpen ? 'Hide details' : 'View details'
      : verified
        ? 'Verified'
        : loading
          ? 'Sending…'
          : linkSent
            ? 'In progress…'
            : manualRejected
              ? 'Re-verify'
              : 'Verify';

  const pillCopy = underReview
    ? 'Under review'
    : failed
      ? 'Not verified'
      : verified
        ? 'Verified'
        : 'Required';

  const handleClick = () => {
    if (underReview) return;
    if (failed) {
      setDetailsOpen((v) => !v);
      return;
    }
    setChooserOpen(true);
  };

  const buttonDisabled = underReview || (!failed && (verified || loading || linkSent));

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-4',
        isT2 ? 'rounded-[3px] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', isT2 ? 'bg-[var(--paper)]' : 'bg-chip')}>
          {icon}
        </div>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10.5px] font-semibold',
            isT2
              ? failed
                ? T2_FAILED_PILL_CLASSES
                : verified
                  ? 'bg-[color-mix(in_srgb,var(--success)_16%,var(--card))] text-[var(--success)]'
                  : 'bg-[color-mix(in_srgb,var(--brass)_16%,var(--card))] text-[var(--brass)]'
              : failed
                ? FAILED_PILL_CLASSES
                : verified
                  ? 'bg-green-bg-2 text-success'
                  : 'bg-amber-bg text-amber-text-2',
          )}
        >
          <Dyn>{pillCopy}</Dyn>
        </span>
      </div>
      <div className="mt-3 flex-1">
        <p className={cn('text-[13.5px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
          <Dyn>{title}</Dyn>
        </p>
        <p className={cn('mt-1 text-[12px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
          <Dyn>{description}</Dyn>
        </p>
        {manualRejected && manualSubmission?.rejectionReason ? (
          <p
            className={cn(
              'mt-2 text-[11.5px] leading-[1.5]',
              isT2 ? 'text-[var(--danger)]' : 'text-danger-text',
            )}
          >
            <Dyn>Your documents were not approved:</Dyn>{' '}
            <Dyn>{manualSubmission.rejectionReason}</Dyn>
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={buttonDisabled}
        className={cn(
          'mt-4 w-full rounded-[9px] py-2.5 text-center text-[12.5px] font-semibold transition-colors',
          isT2
            ? failed
              ? T2_FAILED_BUTTON_CLASSES
              : verified
                ? 'cursor-default bg-[color-mix(in_srgb,var(--success)_16%,var(--card))] text-[var(--success)]'
                : buttonDisabled
                  ? 'cursor-not-allowed bg-[var(--line)] text-[var(--text-muted)]'
                  : 'bg-[var(--ink)] text-[var(--on-ink)] hover:opacity-90'
            : failed
              ? FAILED_BUTTON_CLASSES
              : verified
                ? 'cursor-default bg-green-bg-2 text-success'
                : buttonDisabled
                  ? 'cursor-not-allowed bg-track text-muted'
                  : 'bg-secondary text-white hover:opacity-90',
        )}
      >
        <Dyn>{label}</Dyn>
      </button>
      {failed && detailsOpen && failureDetails && (
        <FailedInsurancePanel details={failureDetails} />
      )}
      {failed && !verified && !underReview ? (
        <button
          type="button"
          onClick={() => setChooserOpen(true)}
          className={cn(
            'mt-2 w-full rounded-[9px] py-2 text-center text-[12px] font-semibold transition-colors',
            isT2
              ? 'border border-[var(--line)] text-[var(--text)] hover:bg-[var(--paper)]'
              : 'border border-card-border text-secondary hover:bg-subtle',
          )}
        >
          <Dyn>Upload documents instead</Dyn>
        </button>
      ) : null}
      <ManualVerificationModal
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        kind={manualKind}
        onUploaded={() => {
          setChooserOpen(false);
          onManualUploaded();
        }}
        onAutomated={onVerify}
        automatedLabel={automatedLabel}
        automatedDescription={automatedDescription}
        rejectionReason={manualRejected ? manualSubmission?.rejectionReason : undefined}
      />
      {error && (
        <p className={cn('mt-2 text-[11.5px]', isT2 ? 'text-[var(--danger)]' : 'text-danger')}><Dyn>{error}</Dyn></p>
      )}
    </div>
  );
}

