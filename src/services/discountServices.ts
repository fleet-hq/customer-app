import axios from 'axios';

import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface FleetDiscountTier {
  percentage: number;
  min_units: number;
  unit_type: 'day' | 'hour' | 'week';
}

export interface FleetDiscountsSummary {
  /** Most-attractive single tier across the company. ``null`` when no
   *  fleet has an active discount. */
  best: FleetDiscountTier | null;
  /** Every distinct tier currently in play, sorted highest-percentage
   *  first; ties broken by the smaller threshold so the front-of-line
   *  tier is always the easiest path to a given headline number. */
  tiers: FleetDiscountTier[];
}

export async function getFleetDiscountsSummary(domain?: string | null): Promise<FleetDiscountsSummary> {
  const domainParams = getDomainParams(domain);
  const res = await axios.get<FleetDiscountsSummary>(
    `${API_URL}/api/fleets/public/discounts-summary/`,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}
