'use client';

import { usePathname } from 'next/navigation';

import { useRentalSiteConfig } from '@/hooks/useRentalSiteConfig';
import { RENTAL_TABS } from '@/lib/rental-tabs';
import { useTenant } from '@/lib/tenant-context';
import type { NavLink } from '@/services/companyContentServices';

export interface SiteNavLink extends NavLink {
  active: boolean;
}

export function useNavLinks(): SiteNavLink[] {
  const tenant = useTenant();
  const pathname = usePathname();
  const { bookableModels } = useRentalSiteConfig();

  const modelLinks = RENTAL_TABS.filter((tab) => bookableModels.includes(tab.model)).map((tab) => ({
    label: tab.label,
    href: tab.href,
  }));

  const links =
    modelLinks.length > 1
      ? tenant.brand.navLinks.flatMap((link) =>
          link.href === '/fleet' ? modelLinks : [link],
        )
      : tenant.brand.navLinks;

  return links.map((link) => ({
    ...link,
    active: link.href.startsWith('/') && !link.href.includes('#') && pathname === link.href,
  }));
}
