import axios from 'axios';

import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LeadPopupPayload {
  name: string;
  phone: string;
  email: string;
  page_url: string;
  utm_source: string;
  utm_campaign: string;
}

export interface LeadPopupResult {
  code: string;
  first_name: string;
}

export type LeadPopupField = 'name' | 'phone' | 'email';

export type LeadPopupErrors = Partial<Record<LeadPopupField, string>>;

export class LeadPopupRejected extends Error {
  constructor(public readonly fields: LeadPopupErrors) {
    super('Lead rejected');
  }
}

const FIELDS: LeadPopupField[] = ['name', 'phone', 'email'];

function fieldErrors(data: unknown): LeadPopupErrors {
  const errors = (data as { errors?: Record<string, string[] | string> } | undefined)?.errors ?? {};
  const out: LeadPopupErrors = {};
  for (const field of FIELDS) {
    const value = errors[field];
    const message = Array.isArray(value) ? value[0] : value;
    if (message) out[field] = message;
  }
  return out;
}

export async function submitLeadPopup(payload: LeadPopupPayload, domain?: string | null): Promise<LeadPopupResult> {
  try {
    const res = await axios.post<LeadPopupResult>(`${API_URL}/api/companies/public/lead-popup/`, payload, {
      params: getDomainParams(domain),
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (err) {
    const fields = axios.isAxiosError(err) && err.response?.status === 400 ? fieldErrors(err.response.data) : {};
    if (Object.keys(fields).length) throw new LeadPopupRejected(fields);
    throw err;
  }
}
