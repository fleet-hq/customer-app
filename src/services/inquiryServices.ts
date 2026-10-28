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
  message?: string;
}

export interface InquiryOffer {
  code: string;
  note: string;
}

export async function submitInquiry(
  payload: InquiryPayload,
  domain?: string | null,
): Promise<InquiryOffer | null> {
  const res = await axios.post<{ offer?: InquiryOffer | null }>(`${API_URL}/api/companies/public/inquiries/`, payload, {
    params: getDomainParams(domain),
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data.offer ?? null;
}
