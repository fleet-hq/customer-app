'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  listFleets,
  getFleetById,
  checkBulkAvailability,
  getFleetUnavailableRanges,
} from '@/services/fleetServices';
import { useTenant } from '@/lib/tenant-context';

export const useFleets = (page: number = 1, name: string = '', pageSize?: number) => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['fleets', tenant.slug, { page, name, pageSize }],
    queryFn: () => listFleets({ page, name, page_size: pageSize }, tenant.domain),
  });
};

export const useFleet = (
  id?: string | number,
  enabled: boolean = true,
  args?: { pickupDatetime?: string; dropoffDatetime?: string },
) => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['fleet', tenant.slug, id, args?.pickupDatetime ?? null, args?.dropoffDatetime ?? null],
    queryFn: () => getFleetById(id!, args, tenant.domain),
    enabled: !!id && enabled,
    // Keep the prior fleet data visible while a refetch (e.g. after the
    // customer changes pickup/dropoff dates) is in flight, so the form
    // doesn't flash a "loading" state on every date tweak.
    placeholderData: keepPreviousData,
  });
};

export const useFleetAvailability = (
  fleetIds: string[],
  pickupDatetime: string | null,
  dropoffDatetime: string | null,
) => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['fleet-availability', tenant.slug, fleetIds, pickupDatetime, dropoffDatetime],
    queryFn: () => checkBulkAvailability(fleetIds, pickupDatetime!, dropoffDatetime!, tenant.domain),
    enabled: fleetIds.length > 0 && !!pickupDatetime && !!dropoffDatetime,
    staleTime: 2 * 60 * 1000,
  });
};

/** Fetch every blocked / booked range for a fleet so the booking
 *  form's date pickers can pre-disable unavailable days. Pass
 *  excludeBookingId on the trip-modification flow so the booking
 *  being edited doesn't block its own current window. */
export const useFleetUnavailableRanges = (
  id?: string | number,
  opts?: { excludeBookingId?: string | number },
) => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['fleet-unavailable-ranges', tenant.slug, id, opts?.excludeBookingId ?? null],
    queryFn: () => getFleetUnavailableRanges(id!, opts, tenant.domain),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
};
