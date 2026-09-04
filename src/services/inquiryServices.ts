import axios from 'axios';

import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface InquiryPayload {
  name: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_at?: string | null;
  dropoff_at?: string | null;
  heard_about?: string;
  promo_code?: string;
  message?: string;
}

export async function submitInquiry(
  payload: InquiryPayload,
  domain?: string | null,
): Promise<void> {
  await axios.post(`${API_URL}/api/companies/public/inquiries/`, payload, {
    params: getDomainParams(domain),
    headers: { 'Content-Type': 'application/json' },
  });
}
