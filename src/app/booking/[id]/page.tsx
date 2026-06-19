'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { BookingActions, ConfirmedBanner, PaymentDueBanner } from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails, Invoice } from '@/components/booking/summary-cards';
import { NextSteps, TripPhotos, buildNextSteps } from '@/components/booking/side-panels';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import { useBookingImages } from '@/hooks/useTripImages';
import { useVerificationStatus } from '@/hooks/useVerification';
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

  if (!tokenReady || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <Header />
        <div className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted">Loading booking…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <Header />
        <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={paths.home}>Back to home</BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink">Booking not found</h1>
            <p className="mt-3 text-sm text-muted">
              We couldn’t load this booking. Please use the link from your confirmation email.
            </p>
          </div>
        </div>
        <Footer />
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

  const tokenSuffix = token ? `?token=${token}` : '';
  const steps = buildNextSteps({
    idVerified,
    insuranceVerified,
    showInsurance: booking.hasOwnInsurance,
    idHref: paths.verifyId + '?bookingId=' + id + (token ? '&token=' + token : ''),
    insuranceHref: paths.verifyInsurance + '?bookingId=' + id + (token ? '&token=' + token : ''),
    agreementHref: paths.terms + '?bookingId=' + id + (token ? '&token=' + token : ''),
  });

  const preTrip = bookingImages.filter((img) => img.imageType === 'preTrip');
  const postTrip = bookingImages.filter((img) => img.imageType === 'postTrip');

  return (
    <div className="bg-white text-ink">
      <Header />
      <div className="mx-auto max-w-[1140px] px-6 pt-[22px] pb-16">
        <BackLink href={paths.home}>Back to home</BackLink>

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[14px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
            Booking <span className="text-secondary">#{booking.invoice.number}</span>
          </h1>
          <BookingActions bookingId={id} token={token} />
        </div>

        {showPaymentDue ? (
          <PaymentDueBanner amount={money(outstanding)} onPay={handlePay} payLoading={payLoading} />
        ) : (
          <ConfirmedBanner email={booking.customer.email} />
        )}

        <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] min-[900px]:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[22px]">
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
              note="Document the car before & after your trip to protect your deposit."
              groups={[
                { title: 'Pre-trip', hint: 'Add before pickup', photos: preTrip },
                { title: 'Post-trip', hint: 'Add at drop-off', photos: postTrip },
              ]}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
