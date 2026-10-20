import axios from 'axios';

import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type RentalModel = 'daily' | 'gig' | 'subscription';

export interface PublicPlan {
  id: number;
  name: string;
  weekly_price: string;
  miles_per_week: number;
  extra_mile_price: string;
  min_term_weeks: number;
  setup_fee: string;
  description: string;
  vehicle_classes: number[];
}

export interface RentalSiteConfig {
  models: RentalModel[];
  website_ongoing: boolean;
  plans: PublicPlan[];
}

export const DAILY_ONLY: RentalSiteConfig = { models: ['daily'], website_ongoing: false, plans: [] };

export async function getRentalSiteConfig(domain?: string | null): Promise<RentalSiteConfig> {
  const res = await axios.get<RentalSiteConfig>(`${API_URL}/api/rentals/public/config/`, {
    params: getDomainParams(domain),
  });
  return res.data;
}

export interface OngoingQuotePayload {
  fleet_id: number;
  rental_model: Exclude<RentalModel, 'daily'>;
  subscription_plan_id?: number | null;
  pickup_datetime: string;
  pickup_location_id: number;
  extras?: { id: number; quantity: number }[];
}

export interface PeriodPrice {
  days: number;
  rental: string;
  extras: string;
  booking_fee: string;
  setup_fee: string;
  location_charges: string;
  tax: string;
  total: string;
}

export type OngoingQuote =
  | { available: false; reason: string }
  | {
      available: true;
      rental_model: Exclude<RentalModel, 'daily'>;
      first_period_end: string;
      first: PeriodPrice;
      recurring: PeriodPrice;
      renew_weekday_name: string;
      weekly_rate: string | null;
      deposit: string;
      deposit_method: 'hold' | 'charge_refund' | string;
      insurance_mode: string;
      min_term_weeks: number;
      return_notice_days: number;
      consent_text: string;
    };

export type OngoingOffer = Extract<OngoingQuote, { available: true }>;

export async function getOngoingQuote(payload: OngoingQuotePayload): Promise<OngoingQuote> {
  const res = await axios.post<OngoingQuote>(`${API_URL}/api/rentals/public/ongoing-quote/`, payload, {
    params: getDomainParams(),
  });
  return res.data;
}
