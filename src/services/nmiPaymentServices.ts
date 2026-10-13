import axios from 'axios';

import { verifyFirstErrorFromAxios } from '@/services/bookingPolicyServices';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface NmiCreatePaymentResponse {
  status: string;
  provider_ref: string;
  pending_id: string;
  booking_id: number | null;
  booking_reference: string | null;
  access_token: string | null;
}

/**
 * Charge the card the renter just entered.
 *
 * NMI files the card in the same call when ``saveCard`` is set, so a
 * renter who agreed to leave one needs no second step.
 */
export async function nmiCreatePaymentForPending(payload: {
  pendingId: string;
  paymentToken: string;
  saveCard?: boolean;
}): Promise<NmiCreatePaymentResponse> {
  try {
    const res = await axios.post(
      `${API_URL}/api/payments/nmi/create-payment/`,
      {
        pending_id: payload.pendingId,
        payment_token: payload.paymentToken,
        save_card: !!payload.saveCard,
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return res.data as NmiCreatePaymentResponse;
  } catch (err) {
    // The helper only recognises the verify-first cases; anything else
    // has to keep its original error or the message is lost.
    const typed = verifyFirstErrorFromAxios(err);
    if (typed) throw typed;
    throw err;
  }
}
