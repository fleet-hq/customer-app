import { pickDefaultLocation } from '@/lib/locations';
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
  StatsSection,
  Template2Settings,
  StepsSection,
  ServiceAreasSection,
  ServicesSection,
  InquiryFormConfig,
  FleetPageSection,
  BlogIndexSection,
  SiteSeoConfig,
  ContentPage,
  ContentLink,
  WebsiteTemplate,
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
  about: CopyBlockSection | null;
  template_2: Template2Settings | null;
  stats: StatsSection | null;
  steps: StepsSection | null;
  fleet_section: CopyBlockSection | null;
  why_choose: CopyBlockSection | null;
  categories: CategoriesSection | null;
  testimonials: TestimonialsSection | null;
  faqs: FaqsSection | null;
  cta: CopyBlockSection | null;
  services: ServicesSection | null;
  inquiry_form: InquiryFormConfig | null;
  fleet_page: FleetPageSection | null;
  blog_index: BlogIndexSection | null;
  seo: SiteSeoConfig | null;
  service_areas: ServiceAreasSection | null;
  pages: Record<string, ContentPage> | null;
  /** Footer "Explore" links. Tenants with extra content pages set these
   *  so the footer lists them; unset keeps the standard links. */
  footerLinks: ContentLink[] | null;
}

export interface TenantLocation {
  id: string;
  name: string;
}
/** Per-tenant marketing / analytics tracking. Empty strings mean "not
 *  configured" so the site can guard each script with a single falsy
 *  check before injecting it. IDs render from fixed vendor templates;
 *  the raw script slots are super-admin-only escape hatches. */
export interface TenantTracking {
  facebookPixelId: string;
  googleAnalyticsId: string;
  gtmId: string;
  tiktokPixelId: string;
  headScript: string;
  bodyScript: string;
  thankYouScript: string;
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
  tracking: TenantTracking;
  websiteTemplate: WebsiteTemplate;
}

export function defaultLocation(tenant: Tenant): TenantLocation | undefined {
  return pickDefaultLocation(tenant.locations, tenant.defaultLocationId);
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
    website_template?: WebsiteTemplate;
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
    tracking?: {
      facebook_pixel_id?: string;
      google_analytics_id?: string;
      google_tag_manager_id?: string;
      tiktok_pixel_id?: string;
      head_script?: string;
      body_script?: string;
      thank_you_script?: string;
    };
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

/** Merge admin-supplied theme colors over the defaults, per key — an
 *  admin who has set ``primary`` but left ``accent`` blank should get
 *  the real primary AND the sane default accent. A blanket object
 *  spread would zero out ``accent`` instead, since the API always
 *  sends all four keys (as '' when unset, never omitted). An empty
 *  CSS custom property is "set but empty," not "unset" — var()'s own
 *  fallback only fires for the latter — so this has to be resolved
 *  here, before the value ever reaches a CSS variable. */
function mergeTheme(theme: Partial<BrandTheme> | undefined): BrandTheme {
  const merged = { ...DEFAULT_THEME };
  for (const key of Object.keys(DEFAULT_THEME) as (keyof BrandTheme)[]) {
    const value = theme?.[key];
    if (value) merged[key] = value;
  }
  return merged;
}

export function tenantFromApi(detail: ApiCompanyDetail, locations: ApiLocation[]): Tenant {
  const content = detail.content ?? {};
  const brand = content.brand ?? {};
  const footer = content.footer ?? {};
  const images = content.images ?? {};
  const sections = content.sections ?? {};
  const tracking = content.tracking ?? {};

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
      theme: mergeTheme(brand.theme),
      navLinks:
        brand.nav_links && brand.nav_links.length > 0 ? brand.nav_links : DEFAULT_NAV_LINKS,
    },
    footer: {
      description: nonEmpty(footer.description),
      // A social row the operator added but never filled in has no
      // platform, and the footer renders on every page — one blank row
      // used to take a whole tenant's site down with a 500.
      socials: (footer.socials ?? []).filter((s) => nonEmpty(s?.platform).trim() !== ''),
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
      about: sections.about ?? null,
      template_2: sections.template_2 ?? null,
      stats: sections.stats ?? null,
      steps: sections.steps ?? null,
      fleet_section: sections.fleet_section ?? null,
      why_choose: sections.why_choose ?? null,
      categories: sections.categories ?? null,
      testimonials: sections.testimonials ?? null,
      faqs: sections.faqs ?? null,
      cta: sections.cta ?? null,
      services: sections.services ?? null,
      inquiry_form: sections.inquiry_form ?? null,
      fleet_page: sections.fleet_page ?? null,
      blog_index: sections.blog_index ?? null,
      seo: sections.seo ?? null,
      service_areas: sections.service_areas ?? null,
      pages: sections.pages ?? null,
      footerLinks: sections.footer_links ?? null,
    },
    tracking: {
      facebookPixelId: nonEmpty(tracking.facebook_pixel_id),
      googleAnalyticsId: nonEmpty(tracking.google_analytics_id),
      gtmId: nonEmpty(tracking.google_tag_manager_id),
      tiktokPixelId: nonEmpty(tracking.tiktok_pixel_id),
      headScript: nonEmpty(tracking.head_script),
      bodyScript: nonEmpty(tracking.body_script),
      thankYouScript: nonEmpty(tracking.thank_you_script),
    },
    websiteTemplate: content.website_template ?? 'template_1',
  };
}

export type { ApiCompanyDetail, ApiLocation };
