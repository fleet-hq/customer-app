import axios from 'axios';
import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AbiQuoteAvailable {
  available: true;
  days: number;
  daily_price: string;
  total_price: string;
  comp_coll_included: boolean;
  currency: string;
}

export interface AbiQuoteUnavailable {
  available: false;
  reason?: string;
}

export type AbiQuoteResponse = AbiQuoteAvailable | AbiQuoteUnavailable;

export interface GetAbiQuoteArgs {
  fleetId: number | string;
  startDate: string;
  endDate: string;
  state?: string | null;
}

export async function getAbiQuote({
  fleetId,
  startDate,
  endDate,
  state,
}: GetAbiQuoteArgs): Promise<AbiQuoteResponse> {
  try {
    const params: Record<string, string | number> = {
      ...getDomainParams(),
      fleet_id: fleetId,
      start_date: startDate,
      end_date: endDate,
    };
    if (state) params.state = state;
    const res = await axios.get<AbiQuoteResponse>(
      `${API_URL}/api/abi/public/quote/`,
      {
        params,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return res.data;
  } catch (err: unknown) {
    const body = (err as { response?: { data?: AbiQuoteResponse } })?.response?.data;
    if (body && typeof body === 'object' && 'available' in body) {
      return body;
    }
    return { available: false, reason: 'ABI unavailable' };
  }
}
