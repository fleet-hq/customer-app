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

export async function getBookingVerificationPolicy(): Promise<BookingVerificationPolicy> {
  const domainParams = getDomainParams();
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
): Promise<StartVerificationPaymentResponse> {
  const domainParams = getDomainParams();
  try {
    const res = await axios.post<StartVerificationPaymentResponse>(
      `${API_URL}/api/bookings/public/${bookingId}/start-verification-payment/`,
      {
        access_token: accessToken,
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      { params: domainParams, headers: { 'Content-Type': 'application/json' } },
    );
    return res.data;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const status = (err as { response?: { status?: number; data?: { status?: string; missing?: string[] } } }).response?.status;
      const data = (err as { response?: { data?: { status?: string; missing?: string[] } } }).response?.data;
      if (status === 409 && data?.missing) {
        throw new VerificationIncompleteError(data.missing);
      }
      if (status === 410) {
        throw new HoldExpiredError();
      }
    }
    throw err;
  }
}
