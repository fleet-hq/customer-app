'use client';

import { useQuery } from '@tanstack/react-query';
import { getDefaultTaxProfile } from '@/services/taxServices';
import { parseTaxProfile } from '@/types/vehicle';
import { useTenant } from '@/lib/tenant-context';

export const useDefaultTaxProfile = () => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['defaultTaxProfile', tenant.slug],
    queryFn: async () => {
      const raw = await getDefaultTaxProfile(tenant.domain);
      return parseTaxProfile(raw);
    },
    staleTime: 5 * 60 * 1000,
  });
};
