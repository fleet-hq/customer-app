import type { RentalModel, RentalSiteConfig } from '@/services/rentalServices';
import type { Vehicle } from '@/types/vehicle';

const MODELS: RentalModel[] = ['daily', 'gig', 'subscription'];

export type SiteRentalConfig = Pick<RentalSiteConfig, 'models' | 'plans'> & { bookableModels: RentalModel[] };

type OnlineVehicle = Pick<Vehicle, 'offers' | 'pricePerWeek' | 'subscriptionPlanId'>;

export function offeredModels(vehicle: Pick<Vehicle, 'offers'>, config: Pick<RentalSiteConfig, 'models'>): RentalModel[] {
  return MODELS.filter((model) => vehicle.offers[model] && config.models.includes(model));
}

export function onlineModels(vehicle: OnlineVehicle, config: SiteRentalConfig): RentalModel[] {
  return offeredModels(vehicle, config).filter((model) => {
    if (model === 'daily') return true;
    if (!config.bookableModels.includes(model)) return false;
    return model === 'gig'
      ? vehicle.pricePerWeek > 0
      : config.plans.some((plan) => plan.id === vehicle.subscriptionPlanId);
  });
}

export function bookableOnline(vehicle: OnlineVehicle, config: SiteRentalConfig): boolean {
  return onlineModels(vehicle, config).length > 0;
}
