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
  is_period?: boolean;
  type_label?: string;
  description: string;
  created_at: string;
}

export interface BillingPaymentRow {
  id: string;
  amount: string;
  status: string;
  succeeded_at: string | null;
  stripe_payment_intent_id: string;
  card_label?: string;
  method?: string;
  covers?: string[];
}

export interface BillingRefundRow {
  id: string;
  amount: string;
  status: string;
  succeeded_at: string | null;
  reason?: string;
}

export type PaymentLinkStatus = 'active' | 'paid' | 'already_paid' | 'expired' | 'superseded' | 'cancelled';

export interface PaymentLinkState {
  status: PaymentLinkStatus;
  amount: string;
  payable: string;
  save_card: boolean;
  covers: string;
  expires_at: string;
  company_name: string;
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
  payment_link?: PaymentLinkState;
}

const RECEIVED_PAYMENT_STATUSES = new Set(['succeeded', 'partially_refunded', 'refunded']);
const DEPOSIT_CHARGE_TYPES = new Set(['security_deposit', 'deposit_topup']);

export function receivedPayments(balance: BookingBalanceSnapshot | undefined): BillingPaymentRow[] {
  return (balance?.payments ?? []).filter((payment) => RECEIVED_PAYMENT_STATUSES.has(payment.status));
}

export function openCharges(charges: BillingChargeRow[]): BillingChargeRow[] {
  return charges.filter((charge) => !charge.is_voided && Number(charge.outstanding) > 0);
}

export type DueKind = 'scheduled' | 'additional';

export function dueKind(charges: BillingChargeRow[]): DueKind {
  const open = openCharges(charges);
  const scheduled = open.length > 0 && open.every((charge) => charge.is_period || DEPOSIT_CHARGE_TYPES.has(charge.type));
  return scheduled ? 'scheduled' : 'additional';
}

export function ledgerDeposit(
  charges: BillingChargeRow[],
  quoted: number | undefined,
): { amount: number; timing: 'hold' | 'charge_refund' } {
  const taken = charges.filter((charge) => !charge.is_voided && DEPOSIT_CHARGE_TYPES.has(charge.type));
  if (taken.length === 0) return { amount: quoted ?? 0, timing: 'hold' };
  return { amount: taken.reduce((sum, charge) => sum + Number(charge.amount), 0), timing: 'charge_refund' };
}

// ── API ───────────────────────────────────────────────────────
export async function getBookingBalance(link?: string | null): Promise<BookingBalanceSnapshot> {
  const res = await axios.get<BookingBalanceSnapshot>(
    `${API_URL}/api/billing/public/bookings/balance/`,
    { headers: getBookingTokenHeaders(), params: link ? { link } : undefined },
  );
  return res.data;
}

export interface CheckoutSessionResult {
  checkout_url: string;
  session_id: string;
  expected_amount: string;
  balance_hash: string;
}

/** A $0 hosted page that stores a card without charging for it, for a
 *  booking that is already settled. Consent is required, same as paying. */
export async function createSaveCardSession(args: {
  successUrl: string;
  cancelUrl: string;
  cardConsent: boolean;
}): Promise<{ checkout_url: string; session_id: string }> {
  const res = await axios.post<{ checkout_url: string; session_id: string }>(
    `${API_URL}/api/billing/public/bookings/save-card/`,
    {
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      card_consent: args.cardConsent,
    },
    { headers: getBookingTokenHeaders() },
  );
  return res.data;
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
  link?: string | null;
}): Promise<CheckoutSessionResult> {
  const res = await axios.post<CheckoutSessionResult>(
    `${API_URL}/api/billing/public/bookings/checkout/`,
    {
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      ...(args.saveCard === undefined ? {} : { save_card: args.saveCard }),
      ...(args.cardConsent ? { card_consent: true } : {}),
      ...(args.link ? { link: args.link } : {}),
    },
    { headers: getBookingTokenHeaders() },
  );
  return res.data;
}
