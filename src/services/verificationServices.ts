import axios from 'axios';
import { getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API Types
export interface ApiIdentitySession {
  client_secret: string;
  session_url: string;
}

// Frontend Types
export interface IdentityVerificationSession {
  sessionId: string;
  url: string;
  status: string;
}

// Create Stripe Identity verification session (uses X-Booking-Token)
// Calls /api/identity/create-session/ which returns a Stripe hosted verification URL
export async function createIdentityVerificationSession(
  customerId: number | string
): Promise<IdentityVerificationSession> {
  const res = await axios.post<ApiIdentitySession>(
    `${API_URL}/api/identity/create-session/`,
    { customer_id: customerId },
    { headers: getBookingTokenHeaders() }
  );
  return {
    sessionId: res.data.client_secret,
    url: res.data.session_url,
    status: 'requires_input',
  };
}

import {
  mapInsuranceVerificationDetails,
  type InsuranceVerificationDetails,
} from '@/services/bookingServices';

// Get verification status for a booking (uses X-Booking-Token)
export async function getVerificationStatus(
  bookingId: number | string
): Promise<{
  idVerification: string;
  insuranceVerification: string;
  insuranceDetails: InsuranceVerificationDetails | null;
}> {
  try {
    const res = await axios.get<{
      id_verification_status: string;
      insurance_verification_status: string | Record<string, unknown>;
    }>(
      `${API_URL}/api/bookings/${bookingId}/`,
      { headers: getBookingTokenHeaders() }
    );

    const raw = res.data.insurance_verification_status;
    const insuranceVerification =
      typeof raw === 'string' ? raw : String(raw?.status || 'pending');

    return {
      idVerification: res.data.id_verification_status || 'pending',
      insuranceVerification,
      insuranceDetails: mapInsuranceVerificationDetails(raw),
    };
  } catch {
    return {
      idVerification: 'pending',
      insuranceVerification: 'pending',
      insuranceDetails: null,
    };
  }
}

export async function createInsuranceVerification(
  customerId: number | string,
  rentalStartDate: string,
  rentalEndDate: string,
  bookingId?: number | string
): Promise<{ magicLink: string | null }> {
  const res = await axios.post<{ magic_link?: string | null }>(
    `${API_URL}/api/modives/verifications/create_verification/`,
    {
      customer_id: customerId,
      rental_start_date: rentalStartDate,
      rental_end_date: rentalEndDate,
      ...(bookingId ? { booking_id: bookingId } : {}),
    },
    { headers: getBookingTokenHeaders() }
  );
  return {
    magicLink: res.data.magic_link ?? null,
  };
}
