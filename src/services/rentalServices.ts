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
