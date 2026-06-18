
export interface TenantTheme {
  primary: string;
  secondary: string;
  primaryHover: string;
  accent: string;
}

export interface TenantLocation {
  id: string;
  name: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo: string;
  logoMono?: string;
  brandDesc: string;
  phone: string;
  email: string;
  address: string;
  copyright: string;
  theme: TenantTheme;
  locations: TenantLocation[];
  defaultLocationId: string;
  navLinks: { label: string; href: string }[];
}

export function defaultLocation(tenant: Tenant): TenantLocation {
  return tenant.locations.find((l) => l.id === tenant.defaultLocationId) ?? tenant.locations[0];
}

const DEFAULT_NAV: Tenant['navLinks'] = [
  { label: 'About', href: '/#about' },
  { label: 'Fleet', href: '/fleet' },
  { label: 'FAQs', href: '/#faqs' },
  { label: 'Contact', href: '/#contact' },
];

const CT_LOCATIONS: TenantLocation[] = [
  { id: 'bdl', name: 'Bradley Intl Airport (BDL)' },
  { id: 'hartford', name: 'Downtown Hartford, CT' },
  { id: 'farmington', name: 'Farmington, CT 06034' },
  { id: 'newhaven', name: 'New Haven, CT' },
  { id: 'stamford', name: 'Stamford, CT' },
];

export const FLEET_HQ: Tenant = {
  id: '1',
  slug: 'fleet-hq',
  name: 'FleetHQ',
  logo: '/images/fleethq-logo-mark.png',
  logoMono: '/images/fleethq-logo-white-mark.png',
  brandDesc:
    'FleetHQ makes renting effortless — a clean, modern fleet, transparent pricing, and friendly local service, all bookable online in minutes.',
  phone: '+1 (307) 269-6561',
  email: 'hello@fleethq.io',
  address: '30 N Gould St, Sheridan, WY 82801',
  copyright: '© 2026 FleetHQ. All rights reserved.',
  theme: {
    primary: '#ED2324',
    secondary: '#000000',
    primaryHover: '#D11F20',
    accent: '#E0921A',
  },
  locations: CT_LOCATIONS,
  defaultLocationId: 'farmington',
  navLinks: DEFAULT_NAV,
};

const HARBOR_DRIVE: Tenant = {
  id: '2',
  slug: 'harbor-drive',
  name: 'Harbor Drive Rentals',
  logo: '/images/logo-mark.png',
  brandDesc:
    'Coastal car rentals done right — clean vehicles, honest pricing, and a local team that treats every trip like our own.',
  phone: '+1 (305) 555-0192',
  email: 'hello@harbordrive.com',
  address: '410 Ocean Ave, Miami Beach, FL 33139',
  copyright: '© 2026 Harbor Drive Rentals. All rights reserved.',
  theme: {
    primary: '#0E7CC4',
    secondary: '#0B3A57',
    primaryHover: '#0C6FAF',
    accent: '#E0921A',
  },
  locations: [
    { id: 'mia', name: 'Miami Intl Airport (MIA)' },
    { id: 'sobe', name: 'South Beach, FL' },
    { id: 'brickell', name: 'Brickell, Miami, FL' },
  ],
  defaultLocationId: 'mia',
  navLinks: DEFAULT_NAV,
};

const TENANTS: Tenant[] = [FLEET_HQ, HARBOR_DRIVE];

const DOMAIN_MAP: Record<string, string> = {
  'fleethq.io': 'fleet-hq',
  'fleet-hq.localhost': 'fleet-hq',
  'harbordrive.com': 'harbor-drive',
  'harbor-drive.localhost': 'harbor-drive',
};

function bySlug(slug: string): Tenant {
  return TENANTS.find((t) => t.slug === slug) ?? FLEET_HQ;
}

export function getTenantByHost(host: string | null | undefined): Tenant {
  if (!host) return FLEET_HQ;
  const clean = host.split(':')[0].toLowerCase().replace(/^www\./, '');

  if (DOMAIN_MAP[clean]) return bySlug(DOMAIN_MAP[clean]);

  const label = clean.split('.')[0];
  const bySubdomain = TENANTS.find((t) => t.slug === label);
  if (bySubdomain) return bySubdomain;

  return FLEET_HQ;
}

export { TENANTS };
