import axios from 'axios';

import { verifyFirstErrorFromAxios } from '@/services/bookingPolicyServices';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface SquareCreatePaymentResponse {
  status: string;
  provider_ref: string;
  pending_id: string;
  booking_id: number | null;
  booking_reference: string | null;
  access_token: string | null;
}

export interface SquareVerifyFirstResponse {
  status: string;
  provider_ref: string;
  booking_id: number;
  booking_reference: string;
  access_token: string;
}

interface DepositConsent {
  saveCardSourceId: string;
  consentCopy: string;
}

function consentPayload(consent: DepositConsent | null) {
  if (!consent) return {};
  return {
    save_card_source_id: consent.saveCardSourceId,
    consent_ack: true,
    consent_copy: consent.consentCopy,
    consent_at: new Date().toISOString(),
  };
}

export async function squareCreatePaymentForPending(payload: {
  pendingId: string;
  sourceId: string;
  amount: number | string;
  currency: string;
  returnUrl: string;
  deposit?: DepositConsent | null;
}): Promise<SquareCreatePaymentResponse> {
  const res = await axios.post<SquareCreatePaymentResponse>(
    `${API_URL}/api/payments/square/create-payment/`,
    {
      source_id: payload.sourceId,
      amount: payload.amount,
      currency: payload.currency,
      return_url: payload.returnUrl,
      pending_id: payload.pendingId,
      ...consentPayload(payload.deposit ?? null),
    },
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    },
  );
  return res.data;
}

export async function squareCreatePaymentForVerifyFirst(payload: {
  bookingId: number;
  accessToken: string;
  sourceId: string;
  currency: string;
  deposit?: DepositConsent | null;
}): Promise<SquareVerifyFirstResponse> {
  try {
    const res = await axios.post<SquareVerifyFirstResponse>(
      `${API_URL}/api/payments/square/verify-first-create-payment/`,
      {
        booking_id: payload.bookingId,
        access_token: payload.accessToken,
        source_id: payload.sourceId,
        currency: payload.currency,
        ...consentPayload(payload.deposit ?? null),
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return res.data;
  } catch (err) {
    const typed = verifyFirstErrorFromAxios(err);
    if (typed) throw typed;
    throw err;
  }
}
