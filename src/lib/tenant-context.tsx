'use client';

import { createContext, useContext } from 'react';
import type { Tenant } from './tenant';

const TenantContext = createContext<Tenant | null>(null);

export function TenantProvider({ tenant, children }: { tenant: Tenant; children: React.ReactNode }) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant(): Tenant {
  const tenant = useContext(TenantContext);
  if (!tenant) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return tenant;
}

/** Non-throwing variant for components that may render OUTSIDE the
 *  TenantProvider — specifically `app/not-found.tsx`, `app/error.tsx`,
 *  and `app/global-error.tsx`. Next.js renders these surfaces in error
 *  paths where the root layout's providers can be unmounted. Returns
 *  ``null`` instead of crashing so the error page itself can render. */
export function useOptionalTenant(): Tenant | null {
  return useContext(TenantContext);
}
