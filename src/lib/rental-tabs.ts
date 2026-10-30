import type { RentalModel } from '@/services/rentalServices';

export interface RentalTab {
  model: RentalModel;
  label: string;
  href: string;
  blurb: string;
  fieldsLabel: string;
  pageHeading: string;
  countNoun: string;
}

export const RENTAL_TABS: RentalTab[] = [
  {
    model: 'daily',
    label: 'Daily rental',
    href: '/fleet',
    blurb: 'Pick-up and return dates',
    fieldsLabel: 'Pick-up & return',
    pageHeading: 'Our fleet.',
    countNoun: 'cars',
  },
  {
    model: 'gig',
    label: 'Gig weekly',
    href: '/drive',
    blurb: 'Ongoing, billed weekly, no end date',
    fieldsLabel: 'Gig weekly plan · pick-up only',
    pageHeading: 'Weekly plans for gig drivers.',
    countNoun: 'rideshare-ready cars',
  },
  {
    model: 'subscription',
    label: 'Subscription',
    href: '/subscribe',
    blurb: 'Ongoing, renews until you cancel',
    fieldsLabel: 'Subscription plan · pick-up only',
    pageHeading: 'Car subscription. One monthly price.',
    countNoun: 'cars',
  },
];

export function tabFor(model: RentalModel): RentalTab {
  return RENTAL_TABS.find((tab) => tab.model === model) ?? RENTAL_TABS[0];
}

export function modelForPath(pathname: string | null): RentalModel {
  return RENTAL_TABS.find((tab) => tab.model !== 'daily' && pathname?.startsWith(tab.href))?.model ?? 'daily';
}
