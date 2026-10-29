import { released } from '@/lib/release';
import { money } from '@/lib/utils';
import { offeredModels } from '@/lib/rental-offers';
import type { PublicPlan, RentalModel, RentalSiteConfig } from '@/services/rentalServices';
import type { Vehicle } from '@/types/vehicle';

export interface WeeklyOffer {
  price: number;
  badge: string | null;
  label: string;
}

export interface RateCard {
  week: number | null;
  hourFrom: number | null;
  extras: string | null;
  weekly: WeeklyOffer | null;
  headline: { price: number; per: 'day' | 'week' };
  mileage: string | null;
}

export interface RateView {
  model: RentalModel;
  plan?: PublicPlan | null;
}

const DAILY_VIEW: RateView = { model: 'daily' };

type RateVehicle = Pick<Vehicle, 'pricePerDay' | 'pricePerHour' | 'pricePerWeek' | 'weeklyScope' | 'offers' | 'milesPerDay'>;

export function planMileage(plan: Pick<PublicPlan, 'miles_per_week'>): string {
  return plan.miles_per_week ? `${plan.miles_per_week.toLocaleString()} miles/week` : 'Unlimited miles';
}

function vehicleMileage(vehicle: RateVehicle): string {
  return Number(vehicle.milesPerDay) > 0 ? `${Number(vehicle.milesPerDay).toLocaleString('en-US')} mi/day` : 'Unlimited';
}

export function rateCard(vehicle: RateVehicle, config: RentalSiteConfig, view: RateView = DAILY_VIEW): RateCard {
  if (view.model === 'subscription' && view.plan) {
    return { week: null, hourFrom: null, extras: null, weekly: null, headline: { price: Number(view.plan.weekly_price), per: 'week' }, mileage: planMileage(view.plan) };
  }
  if (view.model === 'gig' && vehicle.pricePerWeek > 0) {
    return { week: null, hourFrom: null, extras: null, weekly: null, headline: { price: vehicle.pricePerWeek, per: 'week' }, mileage: null };
  }
  const ongoingOnly = vehicle.weeklyScope === 'ongoing';
  const offered = offeredModels(vehicle, config);
  const weeklyBookable = offered.includes('gig') || (!ongoingOnly && offered.includes('daily'));
  const week = released('weeklyRates') && vehicle.pricePerWeek > 0 && weeklyBookable ? vehicle.pricePerWeek : null;
  const hourFrom = vehicle.pricePerHour > 0 ? vehicle.pricePerHour : null;
  const extras = [week ? `${money(week)}/week` : null, hourFrom ? `from ${money(hourFrom)}/hr` : null]
    .filter(Boolean)
    .join(' · ');
  return {
    week,
    hourFrom,
    extras: extras || null,
    weekly: week
      ? {
          price: week,
          badge: ongoingOnly ? 'Weekly rentals available' : null,
          label: ongoingOnly && !config.website_ongoing ? 'Weekly rentals — call or message us' : 'Book weekly',
        }
      : null,
    headline: { price: Number(vehicle.pricePerDay) || 0, per: 'day' },
    mileage: vehicleMileage(vehicle),
  };
}
