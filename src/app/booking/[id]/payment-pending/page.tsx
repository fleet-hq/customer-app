'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { BookingActions, PaymentDueBanner } from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails, Invoice } from '@/components/booking/summary-cards';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import { createBillingCheckoutSession } from '@/services/billingServices';
import { setBookingToken } from '@/utils/booking-token';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';

export default function PaymentPendingPage({ params }: { params: Promise<{ id: string }> }) {
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
  const { data: balance, isLoading: balanceLoading } = useBookingBalance(!!fetchId);

  const [payLoading, setPayLoading] = useState(false);
  const handlePay = async () => {
    if (payLoading) return;
    setPayLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const suffix = token ? `?token=${token}` : '';
      const result = await createBillingCheckoutSession({
        successUrl: `${origin}/booking/${id}${suffix}`,
        cancelUrl: `${origin}/booking/${id}/payment-pending${suffix}`,
      });
      window.location.href = result.checkout_url;
    } catch {
      setPayLoading(false);
    }
  };

  if (!tokenReady || isLoading || balanceLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <Header />
        <div className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted">Loading payment details…</p>
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
  const totalCharged = Number(balance?.total_charged ?? booking.invoice.total);

  return (
    <div className="bg-white text-ink">
      <Header />
      <div className="mx-auto max-w-[1140px] px-6 pt-[22px] pb-16">
        <BackLink href={token ? `${paths.booking(id)}?token=${token}` : paths.booking(id)}>
          Back to booking
        </BackLink>

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[14px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
            Booking <span className="text-secondary">#{booking.invoice.number}</span>
          </h1>
          <BookingActions bookingId={id} token={token} />
        </div>

        {outstanding > 0 && (
          <PaymentDueBanner amount={money(outstanding)} onPay={handlePay} payLoading={payLoading} />
        )}

        <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] min-[900px]:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[22px]">
            <VehicleDriverCard booking={booking} />
            <TripDetails booking={booking} />
            <Invoice
              booking={booking}
              total={totalCharged}
              paid={outstanding <= 0}
              onPay={outstanding > 0 ? handlePay : undefined}
              payLoading={payLoading}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
