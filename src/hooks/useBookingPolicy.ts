'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

import {
  BookingVerificationPolicy,
  getBookingVerificationPolicy,
  startVerificationFirstBooking,
  startVerificationFirstPayment,
} from '@/services/bookingPolicyServices';

export const useBookingVerificationPolicy = () =>
  useQuery<BookingVerificationPolicy>({
    queryKey: ['booking-verification-policy'],
    queryFn: getBookingVerificationPolicy,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

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
