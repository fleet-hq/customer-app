'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import { createBillingCheckoutSession, type BillingPaymentRow, type BillingRefundRow } from '@/services/billingServices';
import { setBookingToken } from '@/utils/booking-token';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

/** All standalone pay-booking data, state, and handlers — shared
 *  verbatim by both templates' pay/booking pages so this billing logic
 *  lives in exactly one place. Templates differ only in how they render
 *  what this returns. This is a pure mechanical extraction of what used
 *  to be inline in page.tsx — nothing about the logic itself has
 *  changed. */
export function usePayBooking(bookingId: string) {
  const tenant = useTenant();
  const token = useSearchParams().get('token');
  const [tokenReady, setTokenReady] = useState(!token);

  useEffect(() => {
    if (token) {
      setBookingToken(token);
      setTokenReady(true);
    }
  }, [token]);

  const fetchId = tokenReady ? bookingId : undefined;
  const { data: booking, isLoading, isError } = useBookingDetails(fetchId);
  const { data: balance, isLoading: balanceLoading } = useBookingBalance(!!fetchId, bookingId);
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

  // E8.5: staff's request pre-ticks the box, and the renter may untick
  // it. Seeded once the booking arrives rather than on every render, so
  // an untick isn't undone by a refetch.
  const staffAskedForCard = !!booking?.cardOnFileRequested;
  const [saveCard, setSaveCard] = useState(false);
  const [saveCardTouched, setSaveCardTouched] = useState(false);
  useEffect(() => {
    if (!saveCardTouched) setSaveCard(staffAskedForCard);
  }, [staffAskedForCard, saveCardTouched]);
  const chooseSaveCard = (next: boolean) => {
    setSaveCardTouched(true);
    setSaveCard(next);
  };

  const [payLoading, setPayLoading] = useState(false);
  const handlePay = async () => {
    if (payLoading) return;
    setPayLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const suffix = token ? `?token=${token}` : '';
      const result = await createBillingCheckoutSession({
        successUrl: `${origin}/booking/${bookingId}${suffix}`,
        cancelUrl: `${origin}/pay/booking/${bookingId}${suffix}`,
        // Only offered when staff asked; otherwise the renter is never
        // shown the box and the booking's own setting decides.
        saveCard: staffAskedForCard ? saveCard : undefined,
        cardConsent: staffAskedForCard && saveCard,
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
    outstanding,
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
