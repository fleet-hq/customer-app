'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import { useCardConsent } from '@/components/booking/use-card-consent';
import { createBillingCheckoutSession, type BillingPaymentRow, type BillingRefundRow } from '@/services/billingServices';
import { setBookingToken } from '@/utils/booking-token';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

/** All payment-pending / outstanding-balance data, state, and handlers
 *  — shared verbatim by both templates' payment-pending pages so this
 *  billing logic lives in exactly one place. Templates differ only in
 *  how they render what this returns. This is a pure mechanical
 *  extraction of what used to be inline in page.tsx — nothing about the
 *  logic itself has changed. */
export function usePaymentPending(id: string) {
  const tenant = useTenant();
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
  const { data: balance, isLoading: balanceLoading } = useBookingBalance(!!fetchId, id);
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
    useCardConsent(booking?.cardOnFileRequested);

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
        ...checkoutConsent,
      });
      window.location.href = result.checkout_url;
    } catch {
      setPayLoading(false);
    }
  };

  const outstanding = Number(balance?.outstanding_balance ?? 0);
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
  const hasHistory = payments.length > 0 || refunds.length > 0 || settledCharges.length > 0;

  return {
    tenant,
    id,
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
    consentBlocked: staffAskedForCard && !saveCard,
    outstanding,
    totalCharged,
    totalPaid,
    payments,
    refunds,
    unpaid,
    settledCharges,
    hasHistory,
  };
}
