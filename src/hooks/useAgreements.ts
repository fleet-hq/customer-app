'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAgreementById,
  getAgreementByBookingId,
  acceptAgreement,
  getCompanySettings,
  getDefaultAgreementTemplate,
} from '@/services/agreementServices';
import { useTenant } from '@/lib/tenant-context';

export const useAgreement = (agreementId?: string | number) =>
  useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: () => getAgreementById(agreementId!),
    enabled: !!agreementId,
  });

export const useAgreementByBooking = (bookingId?: string | number) =>
  useQuery({
    queryKey: ['agreement-by-booking', bookingId],
    queryFn: () => getAgreementByBookingId(bookingId!),
    enabled: !!bookingId,
  });

export const useCompanySettings = () => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['company-settings', tenant.slug],
    queryFn: () => getCompanySettings(tenant.domain),
    staleTime: 10 * 60 * 1000,
  });
};

export const useDefaultAgreementTemplate = () => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['default-agreement-template', tenant.slug],
    queryFn: () => getDefaultAgreementTemplate(tenant.domain),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAcceptAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agreementId, signatureData }: { agreementId: string | number; signatureData: string }) =>
      acceptAgreement(agreementId, signatureData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agreement', data.id] });
      queryClient.invalidateQueries({ queryKey: ['agreement-by-booking'] });
    },
  });
};
