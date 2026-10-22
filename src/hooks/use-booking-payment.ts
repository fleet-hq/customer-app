'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import {
  createBillingCheckoutSession,
  type BillingPaymentRow,
  type BillingRefundRow,
  type PaymentLinkState,
} from '@/services/billingServices';
import { useCardConsent } from '@/components/booking/use-card-consent';

export type LinkView = 'pay' | 'processing' | 'paid' | 'already_paid' | 'expired' | 'failed';

function linkViewFor(link: PaymentLinkState | null, returned: boolean, failed: boolean): LinkView | null {
  if (!link) return null;
  if (link.status === 'paid') return returned ? 'paid' : 'already_paid';
  if (link.status === 'already_paid') return 'already_paid';
  if (link.status !== 'active') return 'expired';
  if (returned) return 'processing';
  return failed ? 'failed' : 'pay';
}

export function useBookingPayment(bookingId: string, enabled: boolean) {
  const params = useSearchParams();
  const token = params.get('token');
  const linkToken = params.get('link');
  const returned = params.get('paid') === '1';
  const [payFailed, setPayFailed] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  const { data: booking } = useBookingDetails(enabled ? bookingId : undefined);
  const { data: balance, refetch } = useBookingBalance(enabled, bookingId, {
    link: linkToken,
    pollMs: returned ? 3000 : undefined,
  });
  const link = balance?.payment_link ?? null;
  const linkView = linkViewFor(link, returned, payFailed);
  const { staffAskedForCard, saveCard, chooseSaveCard, checkoutConsent } =
    useCardConsent(link ? link.save_card : booking?.cardOnFileRequested);

  const handlePay = async () => {
    if (payLoading) return;
    setPayLoading(true);
    setPayFailed(false);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const query = new URLSearchParams({ ...(token ? { token } : {}), ...(linkToken ? { link: linkToken } : {}) }).toString();
      const back = `${origin}/booking/${bookingId}${query ? `?${query}` : ''}`;
      const result = await createBillingCheckoutSession({
        successUrl: linkToken ? `${back}&paid=1` : back,
        cancelUrl: back,
        link: linkToken,
        ...checkoutConsent,
      });
      window.location.href = result.checkout_url;
    } catch {
      setPayLoading(false);
      if (linkToken) {
        setPayFailed(true);
        refetch();
      }
    }
  };

  const outstanding = Number(balance?.outstanding_balance ?? 0);
  const amountDue = link ? Number(link.status === 'active' ? link.payable : link.amount) : outstanding;
  const charges = balance?.charges ?? [];
  const payments: BillingPaymentRow[] = balance?.payments ?? [];
  const refunds: BillingRefundRow[] = balance?.refunds ?? [];
  const ledgerHasBookingFee = charges.some((c) => c.type === 'booking_fee');
  const syntheticBookingTotal = Number(booking?.invoice?.total ?? 0);
  const showSyntheticBooking = !ledgerHasBookingFee && syntheticBookingTotal > 0 && booking?.paymentStatus === 'paid';

  return {
    isLink: !!link,
    linkView,
    amountDue,
    covers: link?.covers ?? '',
    outstanding,
    cardLast4: booking?.cardOnFile?.last4,
    depositAmount: booking?.invoice.deposit,
    bookedOn: booking?.bookedOn ?? '',
    staffAskedForCard,
    saveCard,
    chooseSaveCard,
    consentBlocked: !link && staffAskedForCard && !saveCard,
    payLoading,
    handlePay,
    payments,
    refunds,
    showSyntheticBooking,
    syntheticBookingTotal,
    hasHistory: showSyntheticBooking || payments.length > 0 || refunds.length > 0,
  };
}
