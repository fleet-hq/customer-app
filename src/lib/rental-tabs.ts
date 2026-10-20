import type { RentalModel } from '@/services/rentalServices';

export interface RentalTab {
  model: RentalModel;
  label: string;
  href: string;
}

export const RENTAL_TABS: RentalTab[] = [
  { model: 'daily', label: 'Rent by the day', href: '/fleet' },
  { model: 'gig', label: 'Drive for Uber & DoorDash', href: '/drive' },
  { model: 'subscription', label: 'Subscribe', href: '/subscribe' },
];

export function modelForPath(pathname: string | null): RentalModel {
  return RENTAL_TABS.find((tab) => tab.model !== 'daily' && pathname?.startsWith(tab.href))?.model ?? 'daily';
}
