'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import {
  createBillingCheckoutSession,
  type BillingPaymentRow,
  type BillingRefundRow,
  type PaymentLinkState,
} from '@/services/billingServices';
import { setBookingToken } from '@/utils/booking-token';
import { useTenant } from '@/lib/tenant-context';
import { useCardConsent } from '@/components/booking/use-card-consent';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

/** All standalone pay-booking data, state, and handlers — shared
 *  verbatim by both templates' pay/booking pages so this billing logic
 *  lives in exactly one place. Templates differ only in how they render
 *  what this returns. This is a pure mechanical extraction of what used
 *  to be inline in page.tsx — nothing about the logic itself has
 *  changed. */
export type LinkView = 'pay' | 'processing' | 'paid' | 'already_paid' | 'expired' | 'failed';

function linkViewFor(link: PaymentLinkState | null, returned: boolean, failed: boolean): LinkView | null {
  if (!link) return null;
  if (link.status === 'paid') return returned ? 'paid' : 'already_paid';
  if (link.status === 'already_paid') return 'already_paid';
  if (link.status !== 'active') return 'expired';
  if (returned) return 'processing';
  return failed ? 'failed' : 'pay';
}

export function usePayBooking(bookingId: string) {
  const tenant = useTenant();
  const params = useSearchParams();
  const token = params.get('token');
  const linkToken = params.get('link');
  const returned = params.get('paid') === '1';
  const [payFailed, setPayFailed] = useState(false);
  const [tokenReady, setTokenReady] = useState(!token);

  useEffect(() => {
    if (token) {
      setBookingToken(token);
      setTokenReady(true);
    }
  }, [token]);

  const fetchId = tokenReady ? bookingId : undefined;
  const { data: booking, isLoading, isError } = useBookingDetails(fetchId);
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBookingBalance(!!fetchId, bookingId, {
    link: linkToken,
    pollMs: returned ? 3000 : undefined,
  });
  const link = balance?.payment_link ?? null;
  const linkView = linkViewFor(link, returned, payFailed);
  const { t } = useDynamicTranslation([
    'Amount due',
    'No balance owed',
    'Redirecting…',
    'Pay',
    'Paid in full',
    'item',
    'items',
    'Total charged',
    'Total paid',
    'Outstanding balance',
  ]);

  const { staffAskedForCard, saveCard, chooseSaveCard, checkoutConsent } =
    useCardConsent(link ? link.save_card : booking?.cardOnFileRequested);

  const [payLoading, setPayLoading] = useState(false);
  const handlePay = async () => {
    if (payLoading) return;
    setPayLoading(true);
    setPayFailed(false);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const query = new URLSearchParams({ ...(token ? { token } : {}), ...(linkToken ? { link: linkToken } : {}) }).toString();
      const suffix = query ? `?${query}` : '';
      const result = await createBillingCheckoutSession({
        successUrl: linkToken
          ? `${origin}/pay/booking/${bookingId}${suffix}&paid=1`
          : `${origin}/booking/${bookingId}${token ? `?token=${token}` : ''}`,
        cancelUrl: `${origin}/pay/booking/${bookingId}${suffix}`,
        link: linkToken,
        ...checkoutConsent,
      });
      window.location.href = result.checkout_url;
    } catch {
      setPayLoading(false);
      if (linkToken) {
        setPayFailed(true);
        refetchBalance();
      }
    }
  };

  const outstanding = Number(balance?.outstanding_balance ?? 0);
  const amountDue = link ? Number(link.status === 'active' ? link.payable : link.amount) : outstanding;
  const totalCharged = Number(balance?.total_charged ?? booking?.invoice.total ?? 0);
  const totalPaid = Number(balance?.total_paid ?? 0);

  const charges = balance?.charges ?? [];
  const payments: BillingPaymentRow[] = balance?.payments ?? [];
  const refunds: BillingRefundRow[] = balance?.refunds ?? [];

  const unpaid = charges.filter(
    (c) => !c.is_voided && (c.status === 'pending' || c.status === 'partially_paid'),
  );
  const settledCharges = charges.filter(
    (c) => !c.is_voided && (c.status === 'paid' || c.status === 'refunded' || c.status === 'partially_refunded'),
  );

  const ledgerHasBookingFee = charges.some((c) => c.type === 'booking_fee');
  const syntheticBookingTotal = Number(booking?.invoice?.total ?? 0);
  const bookingActuallyPaid = booking?.paymentStatus === 'paid';
  const showSyntheticBooking =
    !ledgerHasBookingFee && syntheticBookingTotal > 0 && bookingActuallyPaid;

  const hasHistory =
    showSyntheticBooking || payments.length > 0 || refunds.length > 0 || settledCharges.length > 0;

  const displayTotalCharged = totalCharged + (showSyntheticBooking ? syntheticBookingTotal : 0);
  const displayTotalPaid = totalPaid + (showSyntheticBooking ? syntheticBookingTotal : 0);

  return {
    tenant,
    bookingId,
    token,
    tokenReady,
    isLoading,
    isError,
    booking,
    balanceLoading,
    t,
    payLoading,
    handlePay,
    staffAskedForCard,
    saveCard,
    chooseSaveCard,
    // Same gate as the booking page: the card authorization is not
    // optional once staff have asked for it.
    consentBlocked: !link && staffAskedForCard && !saveCard,
    outstanding,
    amountDue,
    linkView,
    isLink: !!link,
    covers: link?.covers ?? '',
    payments,
    refunds,
    unpaid,
    settledCharges,
    showSyntheticBooking,
    syntheticBookingTotal,
    hasHistory,
    displayTotalCharged,
    displayTotalPaid,
  };
}
