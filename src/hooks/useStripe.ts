'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getStripePublishableKey,
  createCheckoutSession,
  createPaymentIntent,
} from '@/services/stripeServices';
import { useTenant } from '@/lib/tenant-context';

export const useStripePublishableKey = () => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['stripePublishableKey', tenant.slug],
    queryFn: () => getStripePublishableKey(tenant.domain),
    staleTime: 30 * 60 * 1000,
  });
};

export const useCreateCheckoutSession = () =>
  useMutation({
    mutationFn: ({
      bookingId,
      customerId,
      successUrl,
      cancelUrl,
    }: {
      bookingId: number;
      customerId: number;
      successUrl: string;
      cancelUrl: string;
    }) => createCheckoutSession(bookingId, customerId, successUrl, cancelUrl),
  });

export const useCreatePaymentIntent = () =>
  useMutation({
    mutationFn: ({
      bookingId,
      paymentMethodId,
      holdDeposit = true,
    }: {
      bookingId: number;
      paymentMethodId: string;
      holdDeposit?: boolean;
    }) => createPaymentIntent(bookingId, paymentMethodId, holdDeposit),
  });
