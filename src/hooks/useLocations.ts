'use client';

import { useQuery } from '@tanstack/react-query';
import { getCompanyLocations } from '@/services/locationServices';


export const useCompanyLocations = () =>
  useQuery({
    queryKey: ['companyLocations'],
    queryFn: getCompanyLocations,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
