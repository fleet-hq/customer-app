'use client';

import { useQuery } from '@tanstack/react-query';
import { getCompanyLocations } from '@/services/locationServices';
import { useTenant } from '@/lib/tenant-context';


export const useCompanyLocations = () => {
  const tenant = useTenant();
  return useQuery({
    queryKey: ['companyLocations', tenant.slug],
    queryFn: () => getCompanyLocations(tenant.domain),
    staleTime: 5 * 60 * 1000,
  });
};
