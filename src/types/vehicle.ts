import { slugify } from '@/lib/utils';

// API response types (from backend)
export interface ApiVehicleImage {
  id: number;
  image: string;
  is_thumbnail: boolean;
}

const DAILY_ONLY_OFFERS: RentalOffers = { daily: true, gig: false, subscription: false };

export interface ApiBookingPrice {
  id?: number;
  price_per_day?: number | null;
  price_per_hour?: number | null;
  price_per_week?: number | null;
  subscription_price_per_week?: number | null;
  auto_cap_enabled?: boolean;
  min_hours?: number | null;
  discounts?: {
    unit_type?: string;
    number_of_days: number;
    discount_percentage: number;
    is_active: boolean;
  }[];
  is_dynamic?: boolean;
  is_peak?: boolean;
  is_promo?: boolean;
  daily_rates?: ApiDailyRate[] | null;
}

export interface ApiDailyRate {
  date: string;
  weekday: string;
  rate: number;
  is_dynamic: boolean;
}

export interface DailyRate {
  date: string;
  weekday: string;
  rate: number;
  isDynamic: boolean;
}

export interface ApiFleetExtra {
  id: number;
  description: string;
  price: number;
  period: 'per_day' | 'per_trip';
  icon?: string;
}

export interface ApiBookingRule {
  id?: number;
  available_at?: number[];
  min_duration?: number | string | null;
  max_duration?: number | string | null;
  allow_short_trips_at_minimum?: boolean;
  miles_per_day?: number;
  miles_overage_rate?: number;
  security_deposit?: number;
  use_default_security_deposit?: boolean;
  booking_fee?: number;
  extras?: ApiFleetExtra[];
  tax_profile?: number | null;
  use_default_tax_profile?: boolean;
  subscription_plan?: number | null;
}

export interface RentalOffers {
  daily: boolean;
  gig: boolean;
  subscription: boolean;
}

export interface ApiFleetClass {
  id: number;
  name: string;
  description: string;
}

export interface ApiVehicle {
  id: number;
  slug?: string;
  name: string;
  year?: number;
  make?: string;
  model?: string;
  color?: string;
  plate_number?: string;
  vin_number?: string;
  seats?: number;
  doors?: number;
  transmission?: string;
  fuel_type?: string;
  fleet_class?: ApiFleetClass;
  location?: string;
  description?: string;
  status?: string;
  images?: ApiVehicleImage[];
  company?: number;
  // Nested objects from detail endpoint
  booking_price?: ApiBookingPrice;
  booking_rule?: ApiBookingRule;
  offers?: RentalOffers;
  // Flat fields from list endpoint (if included)
  price_per_day?: number;
}

export interface ApiPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Frontend types (for UI)
export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  year: number;
  image: string;
  images: string[];
  location: string;
  seats: number;
  transmission: string;
  fuelType: string;
  vehicleType: string;
  make: string;
  model: string;
  color: string;
  pricePerDay: number;
  pricePerHour: number;
  pricePerWeek: number;
  subscriptionPricePerWeek: number | null;
  offers: RentalOffers;
  subscriptionPlanId: number | null;
  autoCapEnabled: boolean;
  minHours: number;
  isDynamicPricing?: boolean;
  isPeakPricing?: boolean;
  isPromoPricing?: boolean;
  dailyRates?: DailyRate[] | null;
  maxDiscount?: number;
  discounts?: { unitType: string; units: number; percentage: number }[];
  licensePlate: string;
  vin: string;
  description: string;
  status?: string;
  availableLocations?: number[];
  minDuration?: number;
  allowShortTripsAtMinimum?: boolean;
  maxDuration?: number;
  milesPerDay?: number;
  milesOverageRate?: number;
  securityDeposit?: number;
  extras: VehicleExtra[];
}

export interface VehicleExtra {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  hasQuantity: boolean;
  icon?: string;
}

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

// Transformer function to convert API data to frontend format
export function transformApiVehicle(apiVehicle: ApiVehicle): Vehicle {
  const thumbnailImage = apiVehicle.images?.find((img) => img.is_thumbnail);
  const mainImage =
    thumbnailImage?.image ||
    apiVehicle.images?.[0]?.image ||
    PLACEHOLDER_IMAGE;

  // Price can be nested in booking_price or flat at top level
  const pricePerDay = Number(
    apiVehicle.booking_price?.price_per_day ??
      apiVehicle.price_per_day ??
      0,
  );
  const pricePerHour = Number(apiVehicle.booking_price?.price_per_hour ?? 0);
  const autoCapEnabled = apiVehicle.booking_price?.auto_cap_enabled !== false;
  const minHours = Math.max(1, Number(apiVehicle.booking_price?.min_hours ?? 1));
  const activeDiscounts = (apiVehicle.booking_price?.discounts || []).filter((d) => d.is_active);
  const maxDiscount = activeDiscounts.length > 0
    ? Math.max(...activeDiscounts.map((d) => d.discount_percentage))
    : 0;

  return {
    id: String(apiVehicle.id),
    // Fallback only covers a stale/partial API response — the real,
    // collision-safe slug always comes from the backend.
    slug: apiVehicle.slug || slugify(`${apiVehicle.name || 'vehicle'}-${apiVehicle.year || ''}`) || String(apiVehicle.id),
    name: apiVehicle.name || 'Unknown Vehicle',
    year: apiVehicle.year || new Date().getFullYear(),
    image: mainImage,
    images: apiVehicle.images?.map((img) => img.image) || [mainImage],
    location: apiVehicle.location || '',
    seats: apiVehicle.seats || 4,
    transmission: apiVehicle.transmission || '',
    fuelType: apiVehicle.fuel_type || '',
    vehicleType: apiVehicle.fleet_class?.description || '',
    make: apiVehicle.make || '',
    model: apiVehicle.model || '',
    color: apiVehicle.color || '',
    pricePerDay,
    pricePerHour,
    pricePerWeek: Number(apiVehicle.booking_price?.price_per_week ?? 0) || 0,
    subscriptionPricePerWeek: Number(apiVehicle.booking_price?.subscription_price_per_week ?? 0) || null,
    offers: apiVehicle.offers ?? DAILY_ONLY_OFFERS,
    subscriptionPlanId: apiVehicle.booking_rule?.subscription_plan ?? null,
    autoCapEnabled,
    minHours,
    isDynamicPricing: !!apiVehicle.booking_price?.is_dynamic,
    isPeakPricing: !!apiVehicle.booking_price?.is_peak,
    isPromoPricing: !!apiVehicle.booking_price?.is_promo,
    dailyRates:
      apiVehicle.booking_price?.daily_rates?.map((d) => ({
        date: d.date,
        weekday: d.weekday,
        rate: Number(d.rate),
        isDynamic: !!d.is_dynamic,
      })) ?? null,
    maxDiscount,
    discounts: activeDiscounts.map((d) => ({
      unitType: d.unit_type || 'day',
      units: d.number_of_days,
      percentage: d.discount_percentage,
    })),
    licensePlate: apiVehicle.plate_number || '',
    vin: apiVehicle.vin_number || '',
    description: apiVehicle.description || '',
    status: apiVehicle.status,
    availableLocations: apiVehicle.booking_rule?.available_at || [],
    minDuration: Number(apiVehicle.booking_rule?.min_duration) || 1,
    allowShortTripsAtMinimum: Boolean(apiVehicle.booking_rule?.allow_short_trips_at_minimum),
    maxDuration: Number(apiVehicle.booking_rule?.max_duration) || undefined,
    milesPerDay: apiVehicle.booking_rule?.miles_per_day,
    milesOverageRate: apiVehicle.booking_rule?.miles_overage_rate,
    securityDeposit: Number(apiVehicle.booking_rule?.security_deposit) || 0,
    extras: (apiVehicle.booking_rule?.extras || []).map((e) => ({
      id: String(e.id),
      title: e.description,
      description: e.description,
      price: Number(e.price),
      priceUnit: e.period === 'per_day' ? '/day' : '/trip',
      hasQuantity: false,
      icon: e.icon,
    })),
  };
}
