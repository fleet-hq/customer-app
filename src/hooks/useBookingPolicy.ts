'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

import {
  BookingVerificationPolicy,
  getBookingVerificationPolicy,
  startVerificationFirstBooking,
  startVerificationFirstPayment,
} from '@/services/bookingPolicyServices';
import { useTenant } from '@/lib/tenant-context';

export const useBookingVerificationPolicy = () => {
  const tenant = useTenant();
  return useQuery<BookingVerificationPolicy>({
    queryKey: ['booking-verification-policy', tenant.slug],
    queryFn: () => getBookingVerificationPolicy(tenant.domain),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useStartVerificationFirstBooking = () =>
  useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      startVerificationFirstBooking(payload),
  });

export const useStartVerificationFirstPayment = () =>
  useMutation({
    mutationFn: ({
      bookingId,
      accessToken,
      successUrl,
      cancelUrl,
    }: {
      bookingId: number;
      accessToken: string;
      successUrl: string;
      cancelUrl: string;
    }) =>
      startVerificationFirstPayment(
        bookingId,
        accessToken,
        successUrl,
        cancelUrl,
      ),
  });
