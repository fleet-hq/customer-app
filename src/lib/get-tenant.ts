import { headers } from 'next/headers';
import { getTenantByHost, type Tenant } from './tenant';

export async function getCurrentTenant(): Promise<Tenant> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  return getTenantByHost(host);
}
