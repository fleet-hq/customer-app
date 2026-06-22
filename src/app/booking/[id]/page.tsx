'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BackLink } from '@/components/ui/back-link';
import {
  BookingActions,
  ConfirmedBanner,
  PaymentDueBanner,
  AwaitingVerificationBanner,
  CancelledBanner,
} from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails, Invoice } from '@/components/booking/summary-cards';
import { OutstandingChargesCard } from '@/components/booking/billing-charges';
import { NextSteps, TripPhotos, buildNextSteps } from '@/components/booking/side-panels';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import { useBookingImages } from '@/hooks/useTripImages';
import {
  useVerificationStatus,
  useCreateIdentityVerification,
  useCreateInsuranceVerification,
} from '@/hooks/useVerification';
import { createBillingCheckoutSession } from '@/services/billingServices';
import { setBookingToken } from '@/utils/booking-token';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useSearchParams().get('token');
  const [tokenReady, setTokenReady] = useState(!token);

  useEffect(() => {
    if (token) {
      setBookingToken(token);
      setTokenReady(true);
    }
  }, [token]);

  const fetchId = tokenReady ? id : undefined;

  const { data: booking, isLoading, isError } = useBookingDetails(fetchId);
  const { data: balance } = useBookingBalance(!!fetchId);
  const { data: bookingImages = [] } = useBookingImages(fetchId);
  const { data: verificationStatus } = useVerificationStatus(fetchId);

  const { mutate: createIdVerification, isPending: idPending } = useCreateIdentityVerification();
  const { mutate: createInsuranceVerification, isPending: insurancePending } =
    useCreateInsuranceVerification();
  const [idError, setIdError] = useState<string | null>(null);
  const [insuranceError, setInsuranceError] = useState<string | null>(null);
  const [insuranceSent, setInsuranceSent] = useState(false);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const isVerifyFirst = booking?.status === 'pending_verification';
  const holdExpiresAt = booking?.holdExpiresAt;
  useEffect(() => {
    if (!isVerifyFirst || !holdExpiresAt) return;
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [isVerifyFirst, holdExpiresAt]);

  const [payLoading, setPayLoading] = useState(false);
  const handlePay = async () => {
    if (payLoading) return;
    setPayLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const suffix = token ? `?token=${token}` : '';
      const result = await createBillingCheckoutSession({
        successUrl: `${origin}/booking/${id}${suffix}`,
        cancelUrl: `${origin}/booking/${id}${suffix}`,
      });
      window.location.href = result.checkout_url;
    } catch {
      setPayLoading(false);
    }
  };

  const handleIdVerify = () => {
    if (!booking) return;
    setIdError(null);
    createIdVerification(
      { customerId: booking.customerId },
      {
        onSuccess: (data) => {
          if (data.url) window.location.href = data.url;
        },
        onError: () => setIdError('Failed to start verification. Please try again.'),
      },
    );
  };

  const handleInsuranceVerify = () => {
    if (!booking) return;
    setInsuranceError(null);
    createInsuranceVerification(
      {
        customerId: booking.customerId,
        rentalStartDate: booking.pickUp.rawDatetime.slice(0, 10),
        rentalEndDate: booking.dropOff.rawDatetime.slice(0, 10),
        bookingId: id,
      },
      {
        onSuccess: () => setInsuranceSent(true),
        onError: () => setInsuranceError('Failed to create insurance verification. Please try again.'),
      },
    );
  };

  if (!tokenReady || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={paths.home}>Back to home</BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink">Booking not found</h1>
            <p className="mt-3 text-sm text-muted">
              We couldn’t load this booking. Please use the link from your confirmation email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const outstanding = Number(balance?.outstanding_balance ?? 0);
  const isCancelled = booking.status === 'cancelled';
  const isPaid = booking.paymentStatus === 'paid' && outstanding <= 0;
  const showPaymentDue = outstanding > 0;

  const idVerified = (verificationStatus?.idVerification ?? booking.verifications.idVerification) === 'verified';
  const insuranceVerified =
    (verificationStatus?.insuranceVerification ?? booking.verifications.insuranceVerification) === 'verified';

  const holdMsLeft = holdExpiresAt ? new Date(holdExpiresAt).getTime() - nowMs : null;
  const holdExpired = holdMsLeft != null && holdMsLeft <= 0;
  const holdCountdownLabel = (() => {
    if (holdMsLeft == null) return null;
    if (holdMsLeft <= 0) return 'Expired';
    const total = Math.floor(holdMsLeft / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();
  const pendingChecks: string[] = [];
  if (!idVerified) pendingChecks.push('verify your ID');
  if (booking.hasOwnInsurance && !insuranceVerified) pendingChecks.push('verify your insurance');
  const verifyMessage =
    pendingChecks.length === 0
      ? 'All checks complete — continue to payment to confirm your booking.'
      : `Please ${pendingChecks.join(' and ')} to continue to payment.`;

  const steps = buildNextSteps({
    idVerified,
    insuranceVerified,
    showInsurance: booking.hasOwnInsurance,
    agreementHref: paths.terms + '?bookingId=' + id + (token ? '&token=' + token : ''),
    onIdVerify: handleIdVerify,
    idPending,
    idError,
    onInsuranceVerify: handleInsuranceVerify,
    insurancePending,
    insuranceSent,
    insuranceError,
  });

  const preTrip = bookingImages.filter((img) => img.imageType === 'preTrip');
  const postTrip = bookingImages.filter((img) => img.imageType === 'postTrip');

  return (
    <div className="bg-white text-ink">
      <div className="mx-auto max-w-[1140px] px-6 pt-[22px] pb-16">
        <BackLink href={paths.home}>Back to home</BackLink>

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[14px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
            Booking <span className="text-secondary">#{booking.invoice.number}</span>
          </h1>
          <BookingActions
            bookingId={id}
            token={token}
            canModify={booking.canModify}
            // ID verification gates every renter-initiated change — the
            // FE check matches the backend ``can_modify`` reason so the
            // disabled state never disagrees with the API response.
            verificationsComplete={idVerified}
          />
        </div>

        {isCancelled ? (
          <CancelledBanner />
        ) : isVerifyFirst ? (
          <AwaitingVerificationBanner
            countdown={holdCountdownLabel}
            expired={holdExpired}
            message={verifyMessage}
          />
        ) : showPaymentDue ? (
          <PaymentDueBanner amount={money(outstanding)} onPay={handlePay} payLoading={payLoading} />
        ) : (
          <ConfirmedBanner email={booking.customer.email} />
        )}

        <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] min-[900px]:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[22px]">
            {/* Itemised breakdown of pending charges. Mirrors fhq's
                inline view so customers see *what* the additional
                charge is, not just the aggregate banner total. */}
            <OutstandingChargesCard
              charges={balance?.charges ?? []}
              paymentPendingHref={`/booking/${id}/payment-pending${token ? `?token=${token}` : ''}`}
            />
            <VehicleDriverCard booking={booking} />
            <TripDetails booking={booking} />
            <Invoice
              booking={booking}
              total={showPaymentDue ? Number(balance?.total_charged ?? booking.invoice.total) : booking.invoice.total}
              paid={isPaid && !isCancelled}
              onPay={showPaymentDue ? handlePay : undefined}
              payLoading={payLoading}
            />
          </div>

          <div className="flex flex-col gap-[18px]">
            <NextSteps steps={steps} />
            <TripPhotos
              bookingId={id}
              canUpload={tokenReady && !isCancelled}
              note="Document the car before & after your trip to protect your deposit."
              groups={[
                { title: 'Pre-trip', hint: 'Add before pickup', photos: preTrip, imageType: 'pre_trip' },
                { title: 'Post-trip', hint: 'Add at drop-off', photos: postTrip, imageType: 'post_trip' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
