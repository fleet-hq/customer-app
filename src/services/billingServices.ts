/**
 * Billing service — talks to the new Phase 3 customer balance
 * endpoint. Authenticated via the existing X-Booking-Token.
 */

import axios from 'axios';

import { getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ── Types ─────────────────────────────────────────────────────
export interface BillingChargeRow {
  id: string;
  type: string;
  amount: string;
  allocated: string;
  outstanding: string;
  status:
    | 'pending'
    | 'partially_paid'
    | 'paid'
    | 'refunded'
    | 'partially_refunded'
    | 'voided';
  is_voided: boolean;
  description: string;
  created_at: string;
}

export interface BillingPaymentRow {
  id: string;
  amount: string;
  status: string;
  succeeded_at: string | null;
  stripe_payment_intent_id: string;
}

export interface BillingRefundRow {
  id: string;
  amount: string;
  status: string;
  succeeded_at: string | null;
}

export interface BookingBalanceSnapshot {
  booking_id: number;
  company_id: number;
  currency: string;
  total_charged: string;
  total_paid: string;
  total_refunded: string;
  outstanding_balance: string;
  last_calculated_at: string;
  charges: BillingChargeRow[];
  payments: BillingPaymentRow[];
  refunds: BillingRefundRow[];
}

// ── API ───────────────────────────────────────────────────────
export async function getBookingBalance(): Promise<BookingBalanceSnapshot> {
  const res = await axios.get<BookingBalanceSnapshot>(
    `${API_URL}/api/billing/public/bookings/balance/`,
    { headers: getBookingTokenHeaders() },
  );
  return res.data;
}

export interface CheckoutSessionResult {
  checkout_url: string;
  session_id: string;
  expected_amount: string;
  balance_hash: string;
}

export async function createBillingCheckoutSession(args: {
  successUrl: string;
  cancelUrl: string;
  /** The renter's own answer on whether their card is kept for
   *  incidentals. Omitted means the page could not ask, and staff's
   *  choice on the booking stands. */
  saveCard?: boolean;
  /** Set when the renter ticked the authorization. The server refuses to
   *  keep a card without it. */
  cardConsent?: boolean;
}): Promise<CheckoutSessionResult> {
  const res = await axios.post<CheckoutSessionResult>(
    `${API_URL}/api/billing/public/bookings/checkout/`,
    {
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      ...(args.saveCard === undefined ? {} : { save_card: args.saveCard }),
      ...(args.cardConsent ? { card_consent: true } : {}),
    },
    { headers: getBookingTokenHeaders() },
  );
  return res.data;
}
