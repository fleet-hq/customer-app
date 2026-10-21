import axios from 'axios';

import { getDomainParams } from '@/utils/company';
import { getBookingTokenHeaders } from '@/utils/booking-token';

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
  daily_insurance_mode?: DailyInsuranceMode | null;
}

export type DailyInsuranceMode = 'bonzah_optional' | 'bonzah_cdw_required' | 'own_policy_only';

export const DAILY_ONLY: RentalSiteConfig = { models: ['daily'], website_ongoing: false, plans: [], daily_insurance_mode: null };

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
  | { available: false; reason: string; code?: string }
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
      required_documents: string[];
      consent_text: string;
    };

export type OngoingOffer = Extract<OngoingQuote, { available: true }>;

export async function getOngoingQuote(payload: OngoingQuotePayload): Promise<OngoingQuote> {
  const res = await axios.post<OngoingQuote>(`${API_URL}/api/rentals/public/ongoing-quote/`, payload, {
    params: getDomainParams(),
  });
  return res.data;
}

export interface RenterPeriod {
  id: number;
  index: number;
  label: string;
  period_start: string;
  period_end: string;
  status: 'scheduled' | 'due' | 'failed' | 'partly_paid' | 'paid' | 'waived' | 'refunded' | 'cancelled' | string;
  overdue: boolean;
  amount: string;
  received: string;
  outstanding: string;
  method_label: string;
}

export interface RenterCharge {
  id: string;
  label: string;
  description: string;
  amount: string;
  outstanding: string;
  created_at: string;
  receipt_url: string | null;
}

export interface RenterRental {
  rental_model: Exclude<RentalModel, 'daily'>;
  renew_weekday_name: string | null;
  billing_state: string;
  collection_method: string;
  next_renewal: { state: string; at?: string; amount?: string | null };
  recurring_amount: string | null;
  periods: RenterPeriod[];
  card_on_file: { label: string } | null;
  min_term_weeks: number;
  return_notice_days: number;
  notice_return_date: string | null;
  earliest_return_date: string;
  ended_at: string | null;
  plan: { name: string; weekly_price: string; miles_per_week: number } | null;
  charges: RenterCharge[];
  required_documents: string[];
}

export async function getRenterRental(): Promise<RenterRental> {
  const res = await axios.get<RenterRental>(`${API_URL}/api/rentals/public/booking/`, {
    headers: getBookingTokenHeaders(),
  });
  return res.data;
}

export async function giveRenterNotice(returnDate: string): Promise<RenterRental> {
  const res = await axios.post<RenterRental>(
    `${API_URL}/api/rentals/public/booking/notice/`,
    { return_date: returnDate },
    { headers: getBookingTokenHeaders() },
  );
  return res.data;
}
