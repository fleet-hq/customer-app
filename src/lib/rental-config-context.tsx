'use client';

import { createContext, useContext } from 'react';
import type { RentalSiteConfig } from '@/services/rentalServices';

const RentalConfigContext = createContext<RentalSiteConfig | null>(null);

export function RentalConfigProvider({
  config,
  children,
}: {
  config: RentalSiteConfig | null;
  children: React.ReactNode;
}) {
  return <RentalConfigContext.Provider value={config}>{children}</RentalConfigContext.Provider>;
}

export function useServerRentalConfig(): RentalSiteConfig | null {
  return useContext(RentalConfigContext);
}
