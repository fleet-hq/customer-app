import axios from 'axios';

import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ── Wire shape (matches PublicCompanyContentSerializer) ──────────── */

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

/** Which customer-central component tree renders this company's site.
 *  Both templates consume the exact same content below — this only
 *  selects the presentational layer. */
export type WebsiteTemplate = 'template_1' | 'template_2';

export interface BrandTheme {
  primary: string;
  secondary: string;
  primary_hover: string;
  accent: string;
}

export interface BrandPayload {
  logo: string | null;
  logo_mono: string | null;
  brand_description: string;
  copyright_text: string;
  theme: BrandTheme;
  nav_links: NavLink[];
}

export interface FooterPayload {
  description: string;
  socials: SocialLink[];
  contact: {
    phone: string;
    email: string;
    address: string;
  };
}

export interface ImagesPayload {
  hero: string | null;
  hero_mobile: string | null;
  why_choose: string | null;
  cta_background: string | null;
  feature_banners: (string | null)[];
}

/* ── Per-section JSON shapes — every key is optional so the API can
   evolve without breaking the FE. Each section component applies its
   own defaults via ``mergeSection()`` in ``tenant-defaults``. ──── */

export interface HeroFeatureItem {
  icon?: string;
  title?: string;
  description?: string;
}

export interface HeroSection {
  layout?: 'classic' | 'featured';
  pill?: string;
  heading_lines?: string[];
  subheading?: string;
  highlight_color?: string;
  highlight_words?: string[];
  features?: HeroFeatureItem[];
}

export interface PromoSection {
  enabled?: boolean;
  badge?: string;
  text?: string;
  cta_label?: string;
}

export interface DiscountBannerSection {
  enabled?: boolean;
  text?: string;
}

export interface FeatureColumnsSection {
  items?: { title: string; description: string }[];
}

/** Template-2 "company at a glance" band. ``value`` is whatever the
 *  operator types ("1240+", "4.9", "24/7") — a leading number animates
 *  up on scroll and any prefix/suffix is preserved verbatim, so no
 *  separate count/suffix/decimals fields are needed. */
export interface StatItem {
  value: string;
  label: string;
}

export interface StatsSection {
  items?: StatItem[];
}

/** Template-2 "how it works" section — an ordered list, so the step
 *  numbers are genuinely positional rather than decorative. */
export interface StepItem {
  title: string;
  description: string;
}

export interface StepsSection {
  eyebrow?: string;
  title?: string;
  items?: StepItem[];
}

/** Template-2-only presentation settings. Template 2 has structural
 *  colours (the dark "ink" surfaces, the navy band) that template 1's
 *  four-colour brand theme has no slot for, and its brass accent
 *  otherwise just inherits the brand primary — which is why a red-brand
 *  tenant got a red "brass". Every field is optional and falls back to
 *  the previous behaviour. Extra template-2 settings belong here too. */
export interface Template2Settings {
  brass?: string;
  brass_bright?: string;
  ink?: string;
  band?: string;
}

export interface CopyBlockSection {
  eyebrow?: string;
  title?: string;
  description?: string;
  cta_label?: string;
}

/** "Areas We Serve" — the places a tenant operates in. Each area may
 *  link to its own landing page, or stand as plain text where there is
 *  no page for it. */
export interface ServiceAreasSection {
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: ContentLink[];
  cta_label?: string;
  cta_href?: string;
}

export interface CategoriesSection {
  eyebrow?: string;
  title?: string;
  description?: string;
}

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  initials: string;
  /** 1–5. Absent means a full five stars, which is what every review
   *  rendered as before this field existed. */
  rating?: number;
}

export interface TestimonialsSection {
  eyebrow?: string;
  title?: string;
  items?: TestimonialItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqsSection {
  eyebrow?: string;
  title?: string;
  items?: FaqItem[];
}

export interface ServicesBlock {
  heading?: string;
  paragraphs?: string[];
  steps?: string[];
  bullets?: string[];
  href?: string;
  link_label?: string;
}

export interface ServicesSection {
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  h1?: string;
  intro?: string[];
  blocks?: ServicesBlock[];
  cta?: { title?: string; description?: string; cta_label?: string; cta_href?: string };
}

export interface InquiryFormConfig {
  title?: string;
  intro?: string[];
  promo_note?: string;
  vehicle_options?: string[];
  pickup_options?: string[];
  dropoff_options?: string[];
  heard_about_options?: string[];
  submit_label?: string;
  submit_microcopy?: string;
  confirmation_title?: string;
  confirmation_body?: string[];
  whatsapp_number?: string;
}

export interface FleetVehicle {
  year?: number;
  make?: string;
  model?: string;
  name?: string;
  seats?: number;
  fuel?: string;
  price?: string;
  electric?: boolean;
}

export interface FleetPageSection {
  eyebrow?: string;
  heading?: string;
  intro?: string[];
  includes_title?: string;
  includes?: string[];
  vehicles?: FleetVehicle[];
  faqs?: FaqItem[];
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

export interface BlogIndexSection {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

export type SchemaType =
  | 'AutoRental'
  | 'Organization'
  | 'Service'
  | 'HowTo'
  | 'FAQPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'WebSite'
  | 'Article'
  | 'ItemList'
  | 'Vehicle';

export interface ContentLink {
  label?: string;
  href?: string;
}

export interface ContentBlock {
  heading?: string;
  /** Icon name from the shared content-icon registry. Chooses the
   *  block's symbol instead of the position-based rotation, and the
   *  marker used for its bullets. */
  icon?: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  faqs?: FaqItem[];
  link?: ContentLink;
  is_step?: boolean;
}

export interface ContentPageMeta {
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_image_alt?: string;
  canonical?: string;
  noindex?: boolean;
}

export interface ContentPageSchema {
  types?: SchemaType[];
  service_type?: string;
  price_range?: string;
  vehicles?: FleetVehicle[];
}

export interface ContentPageCta {
  eyebrow?: string;
  title?: string;
  description?: string;
  cta_label?: string;
  cta_href?: string;
  whatsapp?: boolean;
}

export interface ContentPage {
  layout?: 'default' | 'about' | 'contact';
  eyebrow?: string;
  h1?: string;
  intro?: string[];
  blocks?: ContentBlock[];
  faqs?: FaqItem[];
  cta?: ContentPageCta;
  meta?: ContentPageMeta;
  schema?: ContentPageSchema;
  breadcrumb?: ContentLink[];
}

export interface SiteSeoConfig {
  og_site_name?: string;
  geo_region?: string;
  geo_placename?: string;
  default_og_image?: string;
  whatsapp_number?: string;
  same_as?: string[];
  price_range?: string;
  serving?: string;
  delivery_note?: string;
  founders?: string[];
}

export interface ContentSections {
  hero?: HeroSection | null;
  promo?: PromoSection | null;
  discount_banner?: DiscountBannerSection | null;
  feature_columns?: FeatureColumnsSection | null;
  /** Template 2 has a narrative "about the company" block that template
   *  1 has no equivalent for, so it gets its own key rather than
   *  overloading why_choose (which supplies the heading above the
   *  feature columns). */
  about?: CopyBlockSection | null;
  template_2?: Template2Settings | null;
  stats?: StatsSection | null;
  steps?: StepsSection | null;
  fleet_section?: CopyBlockSection | null;
  why_choose?: CopyBlockSection | null;
  categories?: CategoriesSection | null;
  testimonials?: TestimonialsSection | null;
  faqs?: FaqsSection | null;
  cta?: CopyBlockSection | null;
  services?: ServicesSection | null;
  inquiry_form?: InquiryFormConfig | null;
  fleet_page?: FleetPageSection | null;
  blog_index?: BlogIndexSection | null;
  seo?: SiteSeoConfig | null;
  service_areas?: ServiceAreasSection | null;
  pages?: Record<string, ContentPage> | null;
  /** Footer "Explore" column. Lets tenants with extra content pages
   *  surface them without the footer hardcoding a link list. */
  footer_links?: ContentLink[] | null;
}

export interface CompanyContent {
  brand: BrandPayload;
  footer: FooterPayload;
  images: ImagesPayload;
  sections: ContentSections;
}

export async function getCompanyContent(): Promise<CompanyContent> {
  const domainParams = getDomainParams();
  const res = await axios.get<CompanyContent>(
    `${API_URL}/api/companies/public/content/`,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}
