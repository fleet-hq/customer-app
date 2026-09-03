'use client';

import Link from 'next/link';
import { Check, Clock, Close, Download, IdCard, Pencil, ShieldCheck, Swap } from '@/components/ui/icons';
import { BackLink } from '@/components/ui/back-link';
import { cn, money } from '@/lib/utils';
import { insuranceCoverageLines } from '@/lib/insurance-lines';
import { paths } from '@/lib/paths';
import { TripPhotos } from '@/components/booking/side-panels';
import type { BookingDetails, BookingDriver, InsuranceVerificationDetails } from '@/services/bookingServices';
import SecondaryDriverVerification from '@/components/booking/secondary-driver-verification';
import { useState } from 'react';
import type { BillingChargeRow } from '@/services/billingServices';
import type { TripImage } from '@/services/tripImageServices';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

const FAILED_PILL_CLASSES = 'bg-[#FEF3F2] text-[#B42318]';
const FAILED_BUTTON_CLASSES = 'bg-[#FEF3F2] text-[#B42318] hover:bg-[#FEE4E2]';
const FAILED_PANEL_CLASSES = 'border-[#FECDCA] bg-[#FEF3F2]';
const FAILED_TEXT_PRIMARY = 'text-[#B42318]';
const FAILED_TEXT_SECONDARY = 'text-[#912018]';
const FAILED_TEXT_MUTED = 'text-[#B42318]/70';

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

type BookingMode =
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

  // pending_verification props (ignored in other modes)
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

  // pay flow
  onPay: () => void;
  payLoading: boolean;
  payError: string | null;

  // agreement + actions + photos
  agreementSigned: boolean;
  agreementHref: string | null;
  bookingId: string;
  token: string | null;
  secondaryDrivers: BookingDriver[];
  rentalStartDate: string;
  rentalEndDate: string;
  canModify: BookingDetails['canModify'];
  preTripPhotos: TripImage[];
  postTripPhotos: TripImage[];
  canUploadPhotos: boolean;
}

export function VerifyFirstConfirm(props: Props) {
  const {
    booking,
    backHref,
    mode,
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
    onPay,
    payLoading,
    payError,
    agreementSigned,
    agreementHref,
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
  const rentalLine =
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

  const modeCopy = getModeCopy(mode, {
    email: booking.customer.email,
    outstanding,
    requireId,
    requireInsurance: insuranceBlocking,
  });

  return (
    <div className="bg-white text-ink">
      <div className="mx-auto max-w-[1180px] px-4 pt-5 pb-16 sm:px-6">
        <BackLink href={backHref}>{modeCopy.backLabel}</BackLink>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] leading-[1.2] font-semibold tracking-[-0.01em] text-ink sm:text-[28px]">
              {modeCopy.title(booking.invoice.number)}
            </h1>
            <p className="mt-2 text-[12.5px] leading-[1.5] text-muted sm:text-[13.5px] sm:leading-[1.55]">
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
              <div className="rounded-2xl border border-card-border bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-ink">
                      {doneCount === requiredCount
                        ? 'Verifications complete'
                        : 'Complete verification'}
                    </h3>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {mode === 'pending_verification'
                        ? 'Both steps must be verified before you can pay and confirm.'
                        : doneCount === requiredCount
                          ? "You're fully verified for this rental."
                          : 'ID and insurance verification for this rental.'}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'text-[12.5px] font-semibold',
                      doneCount === requiredCount
                        ? 'text-success'
                        : 'text-amber-text-2',
                    )}
                  >
                    {doneCount} of {requiredCount} verified
                  </p>
                </div>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${(doneCount / requiredCount) * 100}%` }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {requireId && (
                    <VerifySubCard
                      icon={<IdCard size={18} className="text-muted" />}
                      title="ID verification"
                      description="Add your driver's license details so we can confirm your identity."
                      verified={idVerified}
                      loading={idPending}
                      error={idError}
                      linkSent={idLinkSent}
                      onVerify={onIdVerify}
                    />
                  )}
                  {requireInsurance && (
                    <VerifySubCard
                      icon={<ShieldCheck size={18} className="text-muted" />}
                      title="Insurance verification"
                      description="Add your coverage details or confirm the plan you selected."
                      verified={insuranceVerified}
                      loading={insurancePending}
                      error={insuranceError}
                      failed={insuranceFailed}
                      failureDetails={insuranceFailureDetails}
                      onVerify={onInsuranceVerify}
                    />
                  )}
                </div>
              </div>
            )}

            {mode === 'pending_verification' && (
              <SecondaryDriverVerification
                drivers={secondaryDrivers}
                bookingId={bookingId}
                rentalStartDate={rentalStartDate}
                rentalEndDate={rentalEndDate}
              />
            )}

            {mode === 'payment_due' && charges.length > 0 && (
              <OutstandingChargesCard
                charges={charges}
                paymentPendingHref={paymentPendingHref}
              />
            )}

            <AgreementCard
              signed={agreementSigned}
              href={agreementHref}
              mode={mode}
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
            <div className="rounded-2xl border border-card-border bg-white p-5">
              <h3 className="text-[16px] font-bold text-ink">Price summary</h3>
              <div className="mt-4 flex flex-col gap-3">
                {lineItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-3 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="text-ink">{item.label}</p>
                      {item.sub && (
                        <p className="mt-0.5 text-[11.5px] text-faint">{item.sub}</p>
                      )}
                    </div>
                    <span className="whitespace-nowrap font-medium text-ink">
                      {money(item.value)}
                    </span>
                  </div>
                ))}
                {inv.discount > 0 && (
                  <div className="flex items-start justify-between gap-3 text-[13px] text-success">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {inv.discountCode ? 'Discount' : 'Discount applied'}
                      </span>
                      {inv.discountCode && (
                        <span className="rounded-md border border-green-border-2 bg-green-bg px-1.5 py-[1px] text-[10.5px] font-bold uppercase tracking-[0.04em] text-success">
                          {inv.discountCode}
                        </span>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-[14px] font-bold">
                      −{money(inv.discount)}
                    </span>
                  </div>
                )}
                {inv.deposit > 0 && (
                  <div className="flex items-start justify-between gap-3 text-[13px]">
                    <p className="text-ink">
                      Security deposit{' '}
                      <span className="text-[11px] text-faint">(refundable)</span>
                    </p>
                    <span className="whitespace-nowrap font-medium text-ink">
                      {money(inv.deposit)}
                    </span>
                  </div>
                )}
              </div>
              <div className="my-5 h-px bg-card-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-[16px] font-bold text-ink">
                  {mode === 'confirmed_paid' ? 'Total paid' : 'Total due'}
                </span>
                <span>
                  <span className="mr-1 text-[10px] font-semibold text-faint">USD</span>
                  <span
                    className={cn(
                      'text-[22px] font-bold',
                      mode === 'confirmed_paid' ? 'text-success' : 'text-secondary',
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
                <p className="mt-2 text-[11px] leading-[1.5] text-faint">
                  Includes a refundable {money(inv.deposit)} security deposit,
                  refunded after your trip minus any damage claims.
                </p>
              )}

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

              {mode === 'payment_due' && (
                <PayCTA
                  onPay={onPay}
                  disabled={payLoading}
                  loading={payLoading}
                  label={`Pay ${money(outstanding || totalDue)}`}
                  hint={payError}
                />
              )}

              {mode === 'confirmed_paid' && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-[10px] bg-green-bg-2 py-3 text-[13px] font-semibold text-success">
                  <Check size={14} strokeWidth={3} /> Paid
                </div>
              )}

              {mode === 'cancelled' && (
                <div className="mt-4 rounded-[10px] bg-chip py-3 text-center text-[13px] font-semibold text-muted">
                  Booking cancelled
                </div>
              )}

              <ul className="mt-5 space-y-2 text-[12px] text-muted">
                <TrustRow>
                  {mode === 'confirmed_paid'
                    ? 'Confirmation emailed'
                    : mode === 'cancelled'
                      ? 'Refunds follow the operator policy'
                      : 'No charge until you confirm'}
                </TrustRow>
                <TrustRow>Free cancellation up to 48h</TrustRow>
                <TrustRow>Encrypted, secure payment</TrustRow>
              </ul>

              <button
                type="button"
                onClick={() => window.print()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] border border-line py-2.5 text-[12.5px] font-medium text-ink hover:bg-subtle"
              >
                <Download size={14} /> Download invoice
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function getModeCopy(
  mode: BookingMode,
  ctx: { email: string; outstanding: number; requireId: boolean; requireInsurance: boolean },
): { backLabel: string; title: (num: string) => string; subtitle: string } {
  if (mode === 'pending_verification') {
    const verificationLabel = verificationTaskLabel(ctx.requireId, ctx.requireInsurance);
    const subtitle = verificationLabel
      ? `We're holding this vehicle for you. Complete ${verificationLabel} below, then pay to lock in your reservation, you're not charged until you confirm.`
      : "We're holding this vehicle for you. Complete payment below to lock in your reservation.";
    return {
      backLabel: 'Back to checkout',
      title: () => 'Confirm your booking',
      subtitle,
    };
  }
  if (mode === 'payment_due') {
    return {
      backLabel: 'Back to home',
      title: (num) => `Booking #${num}`,
      subtitle: `You have additional charges of ${money(ctx.outstanding)} pending on this booking.`,
    };
  }
  if (mode === 'cancelled') {
    return {
      backLabel: 'Back to home',
      title: (num) => `Booking #${num}`,
      subtitle: 'This booking was cancelled. Any refund will follow the operator policy.',
    };
  }
  return {
    backLabel: 'Back to home',
    title: (num) => `Booking #${num}`,
    subtitle: `Your booking is confirmed. A copy of the confirmation was emailed to ${ctx.email}.`,
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
}: {
  mode: BookingMode;
  holdCountdownLabel: string | null;
  holdExpired: boolean;
  email: string;
  outstanding: number;
  requireId: boolean;
  requireInsurance: boolean;
}) {
  if (mode === 'pending_verification') {
    return (
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-amber-border bg-amber-bg px-4 py-4 sm:px-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
          <Clock size={20} className="text-amber-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-amber-text">
            {holdExpired ? 'This hold has expired' : "We're holding your vehicle"}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-[1.5] text-amber-text-2">
            {holdExpired
              ? 'Please start a new booking — this vehicle is no longer being held for you.'
              : verificationTaskLabel(requireId, requireInsurance)
                ? `Complete ${verificationTaskLabel(requireId, requireInsurance)} and pay before the timer runs out to confirm your booking.`
                : 'Complete payment before the timer runs out to confirm your booking.'}
          </p>
        </div>
        {holdCountdownLabel && (
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-text-2">
              Time left
            </p>
            <p className="mt-0.5 font-inter text-[22px] font-bold tabular-nums text-amber-text-2">
              {holdCountdownLabel}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'payment_due') {
    return (
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-amber-border bg-amber-bg px-4 py-4 sm:px-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
          <Clock size={20} className="text-amber-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-amber-text">Additional payment due</p>
          <p className="mt-0.5 text-[12.5px] leading-[1.5] text-amber-text-2">
            {money(outstanding)} needs to be paid to keep this booking active.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'cancelled') {
    return (
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-danger-border bg-danger-bg px-4 py-4 sm:px-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
          <Close size={20} className="text-danger" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-danger-text">Booking cancelled</p>
          <p className="mt-0.5 text-[12.5px] leading-[1.5] text-danger-soft">
            Any refund will follow the operator&apos;s cancellation policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-4 rounded-2xl border border-green-border bg-green-bg px-4 py-4 sm:px-5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
        <Check size={20} strokeWidth={3} className="text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-success">Your booking is confirmed</p>
        <p className="mt-0.5 text-[12.5px] leading-[1.5] text-muted">
          A confirmation was emailed to {email}. Please arrive at pickup with a valid license and the payment card on file.
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
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div
          className="h-[70px] w-[110px] flex-shrink-0 rounded-lg bg-cover bg-center bg-chip"
          style={{ backgroundImage: `url(${vehicleImage})` }}
        />
        <div className="min-w-0">
          <p className="text-[11.5px] text-muted">{title}</p>
          <h3 className="mt-1 text-[18px] font-bold text-secondary">{vehicleName}</h3>
          <p className="mt-1 text-[12.5px] text-muted">
            {location && <>{location} · </>}
            {dateRange}
          </p>
        </div>
      </div>
    </div>
  );
}

function TripInfoCard({
  pickup,
  dropoff,
  customer,
}: {
  pickup: BookingDetails['pickUp'];
  dropoff: BookingDetails['dropOff'];
  customer: BookingDetails['customer'];
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 sm:p-5">
      <h3 className="text-[15px] font-bold text-ink">Trip details</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TripInfoRow label="Pickup" primary={`${pickup.date} · ${pickup.time}`} secondary={pickup.address} />
        <TripInfoRow label="Drop-off" primary={`${dropoff.date} · ${dropoff.time}`} secondary={dropoff.address} />
        <TripInfoRow label="Renter" primary={customer.name} secondary={customer.email} />
        {customer.phone && (
          <TripInfoRow label="Phone" primary={customer.phone} />
        )}
      </div>
    </div>
  );
}

function TripInfoRow({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-medium text-ink">{primary}</p>
      {secondary && (
        <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">{secondary}</p>
      )}
    </div>
  );
}

function OutstandingChargesCard({
  charges,
  paymentPendingHref,
}: {
  charges: BillingChargeRow[];
  paymentPendingHref: string;
}) {
  const pending = charges.filter(
    (c) => c.status !== 'paid' && c.status !== 'refunded' && !c.is_voided,
  );
  if (pending.length === 0) return null;
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-ink">Additional charges</h3>
        <a
          href={paymentPendingHref}
          className="text-[12.5px] font-semibold text-primary underline"
        >
          View details
        </a>
      </div>
      <ul className="mt-3 space-y-2 text-[13px]">
        {pending.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3">
            <span className="text-ink">{c.description || c.type}</span>
            <span className="whitespace-nowrap font-medium text-ink">
              {money(Number(c.amount || 0))}
            </span>
          </li>
        ))}
      </ul>
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
  return (
    <>
      <button
        type="button"
        onClick={onPay}
        disabled={disabled}
        className={cn(
          'mt-4 w-full rounded-[10px] py-3 text-center text-[13.5px] font-semibold transition-colors',
          disabled
            ? 'cursor-not-allowed bg-track text-muted'
            : 'bg-primary text-white hover:bg-primary-hover',
        )}
      >
        {loading ? 'Redirecting…' : label}
      </button>
      {hint && (
        <p className="mt-3 flex items-start gap-2 text-[12px] text-muted">
          <span className="mt-[1px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-line text-[10px] leading-none text-faint">
            i
          </span>
          <span>{hint}</span>
        </p>
      )}
    </>
  );
}

function AgreementCard({
  signed,
  href,
  mode,
}: {
  signed: boolean;
  href: string | null;
  mode: BookingMode;
}) {
  if (!href && !signed) return null;
  const primary = signed ? 'View agreement' : 'Sign now';
  return (
    <div className="rounded-2xl border border-card-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
              signed ? 'bg-green-bg-2 text-success' : 'bg-chip text-muted',
            )}
          >
            {signed ? <Check size={16} strokeWidth={3} /> : <Pencil size={14} strokeWidth={2.5} />}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">Rental agreement</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {signed
                ? 'Signed. A copy is attached to this booking.'
                : mode === 'pending_verification'
                  ? 'Review and sign before pickup — it takes about a minute.'
                  : 'Review and sign to complete your paperwork.'}
            </p>
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className={cn(
              'inline-flex flex-shrink-0 items-center justify-center rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-colors',
              signed
                ? 'border border-line bg-white text-ink hover:bg-subtle'
                : 'bg-primary text-white hover:bg-primary-hover',
            )}
          >
            {primary}
          </Link>
        )}
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
  const withToken = (href: string) =>
    token ? `${href}?token=${encodeURIComponent(token)}` : href;
  const canEdit = !!(canModify?.extend || canModify?.reduce) && verificationsComplete;
  const canSwap = !!canModify?.swap && verificationsComplete;
  const canCancel = !!canModify?.cancel && verificationsComplete;

  const btn = 'inline-flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-3 py-2 text-[12.5px] font-medium text-ink hover:bg-subtle transition-colors';
  const btnDisabled = 'inline-flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-3 py-2 text-[12.5px] font-medium text-faint opacity-60 cursor-not-allowed';

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
        {icon} {label}
      </Link>
    ) : (
      <button type="button" disabled className={btnDisabled}>
        {icon} {label}
      </button>
    );

  return (
    <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
      <Action
        label="Modify"
        icon={<Pencil size={13} className={canEdit ? 'text-primary' : 'text-faint'} />}
        href={paths.modify(bookingId)}
        enabled={canEdit}
      />
      <Action
        label="Change vehicle"
        icon={<Swap size={13} className={canSwap ? 'text-primary' : 'text-faint'} />}
        href={paths.swap(bookingId)}
        enabled={canSwap}
      />
      <Action
        label="Cancel"
        icon={<Close size={13} strokeWidth={2} className={canCancel ? 'text-danger' : 'text-faint'} />}
        href={paths.cancel(bookingId)}
        enabled={canCancel}
      />
    </div>
  );
}

function TrustRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check size={13} strokeWidth={3} className="text-success" />
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
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const label = failed
    ? detailsOpen ? 'Hide details' : 'View details'
    : verified
      ? 'Verified'
      : loading
        ? 'Sending…'
        : linkSent
          ? 'In progress…'
          : 'Verify';

  const pillCopy = failed ? 'Not verified' : verified ? 'Verified' : 'Required';

  const handleClick = () => {
    if (failed) {
      setDetailsOpen((v) => !v);
      return;
    }
    onVerify();
  };

  const buttonDisabled = !failed && (verified || loading || linkSent);

  return (
    <div className="flex flex-col rounded-xl border border-card-border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chip">
          {icon}
        </div>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10.5px] font-semibold',
            failed
              ? FAILED_PILL_CLASSES
              : verified
                ? 'bg-green-bg-2 text-success'
                : 'bg-amber-bg text-amber-text-2',
          )}
        >
          {pillCopy}
        </span>
      </div>
      <div className="mt-3 flex-1">
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={buttonDisabled}
        className={cn(
          'mt-4 w-full rounded-[9px] py-2.5 text-center text-[12.5px] font-semibold transition-colors',
          failed
            ? FAILED_BUTTON_CLASSES
            : verified
              ? 'cursor-default bg-green-bg-2 text-success'
              : buttonDisabled
                ? 'cursor-not-allowed bg-track text-muted'
                : 'bg-secondary text-white hover:opacity-90',
        )}
      >
        {label}
      </button>
      {failed && detailsOpen && failureDetails && (
        <FailedInsurancePanel details={failureDetails} />
      )}
      {error && (
        <p className="mt-2 text-[11.5px] text-danger">{error}</p>
      )}
    </div>
  );
}

function FailedInsurancePanel({ details }: { details: InsuranceVerificationDetails }) {
  const rows: { label: string; value: string }[] = [];
  if (details.carrier) rows.push({ label: 'Carrier', value: details.carrier });
  if (details.policyNumber) rows.push({ label: 'Policy #', value: details.policyNumber });
  if (details.policyStatus) rows.push({ label: 'Policy status', value: humanize(details.policyStatus) });
  if (details.policyExpiryDate) rows.push({ label: 'Expiry', value: formatExpiryDate(details.policyExpiryDate) });
  return (
    <div className={cn('mt-3 rounded-lg border p-3', FAILED_PANEL_CLASSES)}>
      <p className={cn('text-[12px] font-semibold', FAILED_TEXT_PRIMARY)}>
        Insurance couldn&apos;t be verified{details.disposition ? ` — ${humanize(details.disposition)}` : ''}
      </p>
      {rows.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className={cn('text-[10.5px] font-medium', FAILED_TEXT_MUTED)}>{r.label}</dt>
              <dd className={cn('text-[10.5px]', FAILED_TEXT_SECONDARY)}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {details.remediationMessages.length > 0 && (
        <ul className={cn('mt-2 list-disc space-y-0.5 pl-4 text-[11px]', FAILED_TEXT_SECONDARY)}>
          {details.remediationMessages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      <p className={cn('mt-2 text-[10.5px] italic', FAILED_TEXT_MUTED)}>
        Contact the operator to update your coverage.
      </p>
    </div>
  );
}

function humanize(s: string): string {
  if (!s) return '';
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatExpiryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}
