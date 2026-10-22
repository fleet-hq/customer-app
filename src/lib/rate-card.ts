import { released } from '@/lib/release';
import { money } from '@/lib/utils';
import type { RentalSiteConfig } from '@/services/rentalServices';
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
}

type RateVehicle = Pick<Vehicle, 'pricePerHour' | 'pricePerWeek' | 'weeklyScope' | 'offersGig'>;

export function rateCard(vehicle: RateVehicle, config: RentalSiteConfig): RateCard {
  const ongoingOnly = vehicle.weeklyScope === 'ongoing';
  const weeklyBookable = !ongoingOnly || (config.models.includes('gig') && vehicle.offersGig);
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
  };
}
