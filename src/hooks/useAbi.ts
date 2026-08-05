'use client';

import { useQuery } from '@tanstack/react-query';
import { getAbiQuote, type AbiQuoteResponse, type GetAbiQuoteArgs } from '@/services/abiServices';

export const useAbiQuote = ({
  fleetId,
  startDate,
  endDate,
  state,
}: Partial<GetAbiQuoteArgs>) => {
  const enabled = Boolean(fleetId && startDate && endDate && startDate <= endDate);
  return useQuery<AbiQuoteResponse>({
    queryKey: ['abiQuote', String(fleetId ?? ''), startDate ?? '', endDate ?? '', state ?? ''],
    queryFn: () =>
      getAbiQuote({
        fleetId: fleetId as number | string,
        startDate: startDate as string,
        endDate: endDate as string,
        state: state ?? undefined,
      }),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
