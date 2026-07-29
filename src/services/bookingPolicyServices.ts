import axios from 'axios';

import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type BookingVerificationMode = 'none' | 'after' | 'before';
export type BookingHoldUnit = 'minutes' | 'hours' | 'days';

export interface BookingVerificationPolicy {
  mode: BookingVerificationMode;
  require_id: boolean;
  require_insurance: boolean;
  hold_expiry_value: number;
  hold_expiry_unit: BookingHoldUnit;
}

export async function getBookingVerificationPolicy(domain?: string | null): Promise<BookingVerificationPolicy> {
  const domainParams = getDomainParams(domain);
  const res = await axios.get<BookingVerificationPolicy>(
    `${API_URL}/api/companies/public/booking-verification-policy/`,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}

export interface StartVerificationResponse {
  booking_id: number;
  booking_reference: string;
  access_token: string;
  token_expires_at: string | null;
  hold_expires_at: string | null;
  status: string;
}

export async function startVerificationFirstBooking(
  payload: Record<string, unknown>,
): Promise<StartVerificationResponse> {
  const domainParams = getDomainParams();
  const res = await axios.post<StartVerificationResponse>(
    `${API_URL}/api/bookings/public/start-verification/`,
    payload,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}

export interface StartVerificationPaymentResponse {
  checkout_url: string;
}

export class VerificationIncompleteError extends Error {
  missing: string[];
  constructor(missing: string[]) {
    super(`Verification incomplete: ${missing.join(', ')}`);
    this.missing = missing;
  }
}

export class HoldExpiredError extends Error {
  constructor() {
    super('Verification hold expired');
  }
}

export async function startVerificationFirstPayment(
  bookingId: number,
  accessToken: string,
  successUrl: string,
  cancelUrl: string,
  provider?: 'stripe' | 'square',
): Promise<StartVerificationPaymentResponse> {
  const domainParams = getDomainParams();
  try {
    const res = await axios.post<StartVerificationPaymentResponse>(
      `${API_URL}/api/bookings/public/${bookingId}/start-verification-payment/`,
      {
        access_token: accessToken,
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(provider ? { provider } : {}),
      },
      { params: domainParams, headers: { 'Content-Type': 'application/json' } },
    );
    return res.data;
  } catch (err) {
    const typed = verifyFirstErrorFromAxios(err);
    if (typed) throw typed;
    throw err;
  }
}

export function verifyFirstErrorFromAxios(err: unknown): Error | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const status = (err as { response?: { status?: number; data?: { missing?: string[] } } }).response?.status;
    const data = (err as { response?: { data?: { missing?: string[] } } }).response?.data;
    if (status === 409 && data?.missing) {
      return new VerificationIncompleteError(data.missing);
    }
    if (status === 410) {
      return new HoldExpiredError();
    }
  }
  return null;
}
