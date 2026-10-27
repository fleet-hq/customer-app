export interface TripQuery {
  pickupLocId?: string | null;
  dropoffLocId?: string | null;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string | null;
  returnTime?: string | null;
  model?: string | null;
}

const KEYS: (keyof TripQuery)[] = ['pickupLocId', 'dropoffLocId', 'pickupDate', 'pickupTime', 'returnDate', 'returnTime', 'model'];

export function applyTripQuery(params: URLSearchParams, trip: TripQuery): URLSearchParams {
  for (const key of KEYS) {
    const value = trip[key];
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}
