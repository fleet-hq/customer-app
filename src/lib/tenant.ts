import type {
  BrandTheme,
  CategoriesSection,
  ContentSections,
  CopyBlockSection,
  DiscountBannerSection,
  FooterPayload,
  HeroSection,
  ImagesPayload,
  NavLink,
  PromoSection,
  TestimonialsSection,
  FaqsSection,
  FeatureColumnsSection,
} from '@/services/companyContentServices';
import { DEFAULT_NAV_LINKS, DEFAULT_THEME } from './tenant-defaults';

/** Sections shape used by the FE. Mirrors ``ContentSections`` from
 *  the API but normalises ``undefined`` → ``null`` so each consumer
 *  can do a single truthy check without remembering which fields the
 *  serializer emits as missing. A null section means "operator hasn't
 *  configured it" → component should not render. */
export interface TenantSections {
  hero: HeroSection | null;
  promo: PromoSection | null;
  discount_banner: DiscountBannerSection | null;
  feature_columns: FeatureColumnsSection | null;
  fleet_section: CopyBlockSection | null;
  why_choose: CopyBlockSection | null;
  categories: CategoriesSection | null;
  testimonials: TestimonialsSection | null;
  faqs: FaqsSection | null;
  cta: CopyBlockSection | null;
}

export interface TenantLocation {
  id: string;
  name: string;
}

/** Tenant view consumed by every server/client component. Any field
 *  that can legitimately be "not configured yet" is nullable — the
 *  FE never invents marketing copy, image fallbacks, or fake content
 *  in its place. */
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string;
  locations: TenantLocation[];
  defaultLocationId: string;

  brand: {
    /** ``null`` when no logo has been uploaded — header renders the
     *  tenant name as a text wordmark instead of a broken image. */
    logo: string | null;
    logoMono: string | null;
    description: string;
    copyright: string;
    theme: BrandTheme;
    navLinks: NavLink[];
  };
  footer: FooterPayload;
  images: ImagesPayload;
  sections: TenantSections;
}

export function defaultLocation(tenant: Tenant): TenantLocation | undefined {
  if (!tenant.locations.length) return undefined;
  return tenant.locations.find((l) => l.id === tenant.defaultLocationId) ?? tenant.locations[0];
}

/** Replace ``{company}`` placeholders in admin-supplied copy with the
 *  tenant's display name. */
export function withCompany(text: string, company: string): string {
  return text.replaceAll('{company}', company);
}

/* ── API → Tenant mapping ─────────────────────────────────────────── */

interface ApiCompanyDetail {
  id: number;
  name: string;
  email: string | null;
  phone_no: string | null;
  company_picture: string | null;
  domain: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  default_location: { id: number; name: string } | null;
  content: {
    brand?: {
      logo?: string | null;
      logo_mono?: string | null;
      brand_description?: string;
      copyright_text?: string;
      theme?: Partial<BrandTheme>;
      nav_links?: NavLink[];
    };
    footer?: Partial<FooterPayload>;
    images?: Partial<ImagesPayload>;
    sections?: ContentSections;
  };
}

interface ApiLocation {
  id: number;
  name: string;
}

function deriveSlugFromDomain(domain: string | null): string {
  if (!domain) return 'unknown';
  const clean = domain.toLowerCase().replace(/^www\./, '');
  return clean.split('.')[0] || clean;
}

function nonEmpty(value: string | null | undefined): string {
  return value ?? '';
}

export function tenantFromApi(detail: ApiCompanyDetail, locations: ApiLocation[]): Tenant {
  const content = detail.content ?? {};
  const brand = content.brand ?? {};
  const footer = content.footer ?? {};
  const images = content.images ?? {};
  const sections = content.sections ?? {};

  return {
    id: String(detail.id),
    slug: deriveSlugFromDomain(detail.domain),
    name: detail.name,
    domain: detail.domain ?? '',
    locations: locations.map((l) => ({ id: String(l.id), name: l.name })),
    defaultLocationId: detail.default_location ? String(detail.default_location.id) : '',
    brand: {
      logo: brand.logo ?? detail.company_picture ?? null,
      logoMono: brand.logo_mono ?? null,
      description: nonEmpty(brand.brand_description),
      copyright: nonEmpty(brand.copyright_text),
      theme: { ...DEFAULT_THEME, ...(brand.theme ?? {}) },
      navLinks:
        brand.nav_links && brand.nav_links.length > 0 ? brand.nav_links : DEFAULT_NAV_LINKS,
    },
    footer: {
      description: nonEmpty(footer.description),
      socials: footer.socials ?? [],
      contact: {
        phone: nonEmpty(footer.contact?.phone) || nonEmpty(detail.phone_no),
        email: nonEmpty(footer.contact?.email) || nonEmpty(detail.email),
        address:
          nonEmpty(footer.contact?.address) ||
          [detail.address, detail.city, detail.state, detail.zip_code]
            .filter((p) => p && p.trim().length > 0)
            .join(', '),
      },
    },
    images: {
      hero: images.hero ?? null,
      hero_mobile: images.hero_mobile ?? null,
      why_choose: images.why_choose ?? null,
      cta_background: images.cta_background ?? null,
      feature_banners: (images.feature_banners ?? []).slice(0, 2),
    },
    sections: {
      hero: sections.hero ?? null,
      promo: sections.promo ?? null,
      discount_banner: sections.discount_banner ?? null,
      feature_columns: sections.feature_columns ?? null,
      fleet_section: sections.fleet_section ?? null,
      why_choose: sections.why_choose ?? null,
      categories: sections.categories ?? null,
      testimonials: sections.testimonials ?? null,
      faqs: sections.faqs ?? null,
      cta: sections.cta ?? null,
    },
  };
}

export type { ApiCompanyDetail, ApiLocation };
