import { useTenant } from '@/lib/tenant-context';
import { tenantToday } from '@/lib/trip-defaults';

export function useTenantToday(): string {
  return tenantToday(useTenant().timezone);
}
