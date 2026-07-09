'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getInsuranceOptions,
  getInsuranceOptionsBundle,
  getManualInsurancePackagesForTenant,
  getBookingById,
  createBooking,
  startBookingCheckout,
  startEmbedBookingPayment,
  getBookingDrivers,
  createBookingDriver,
  type CreateBookingPayload,
  type StartCheckoutPayload,
} from '@/services/bookingServices';

export const useInsuranceOptions = (args?: {
  pickupDatetime?: string;
  dropoffDatetime?: string;
}) =>
  useQuery({
    queryKey: [
      'insuranceOptions',
      args?.pickupDatetime ?? null,
      args?.dropoffDatetime ?? null,
    ],
    queryFn: () => getInsuranceOptions(args),
    staleTime: 5 * 60 * 1000,
  });

/** Full insurance bundle — Bonzah options + manual packages together.
 *  Use this on the checkout page so the tabs render both providers
 *  when the tenant has enabled each. Wrapping the same underlying
 *  endpoint as ``useInsuranceOptions`` so we don't double-fetch. */
export const useInsuranceOptionsBundle = (args?: {
  pickupDatetime?: string;
  dropoffDatetime?: string;
}) =>
  useQuery({
    queryKey: [
      'insuranceOptionsBundle',
      args?.pickupDatetime ?? null,
      args?.dropoffDatetime ?? null,
    ],
    queryFn: () => getInsuranceOptionsBundle(args),
    staleTime: 5 * 60 * 1000,
  });

/** Tenant-scoped manual insurance packages — dedicated fast endpoint
 *  that doesn't wait on Bonzah's live-quote call. Use this alongside
 *  ``useInsuranceOptions`` so the Custom tab hydrates as soon as the
 *  DB round-trip finishes, without blocking on Bonzah. */
export const useManualInsurancePackagesForTenant = () =>
  useQuery({
    queryKey: ['manualInsurancePackagesForTenant'],
    queryFn: () => getManualInsurancePackagesForTenant(),
    staleTime: 5 * 60 * 1000,
  });

export const useBookingDetails = (bookingId?: string | number) =>
  useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId,
  });

export const useCreateBooking = () =>
  useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
  });

// NEW pre-payment flow — replaces useCreateBooking + useCreateCheckoutSession
// in the booking page submit handler.
export const useStartBookingCheckout = () =>
  useMutation({
    mutationFn: (payload: StartCheckoutPayload) => startBookingCheckout(payload),
  });

// Embed / Stripe Elements variant. Returns a PaymentIntent client_secret
// for in-iframe card entry instead of a hosted-checkout URL.
export const useStartEmbedBookingPayment = () =>
  useMutation({
    mutationFn: (payload: CreateBookingPayload) => startEmbedBookingPayment(payload),
  });

export const useBookingDrivers = (bookingId?: string | number) =>
  useQuery({
    queryKey: ['bookingDrivers', bookingId],
    queryFn: () => getBookingDrivers(bookingId!),
    enabled: !!bookingId,
  });

export const useCreateBookingDriver = () =>
  useMutation({
    mutationFn: ({ bookingId, driver }: { bookingId: string | number; driver: { full_name: string; email: string; phone: string } }) =>
      createBookingDriver(bookingId, driver),
  });
