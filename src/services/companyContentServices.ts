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

export interface CopyBlockSection {
  eyebrow?: string;
  title?: string;
  description?: string;
  cta_label?: string;
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
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
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
}

export interface ContentSections {
  hero?: HeroSection | null;
  promo?: PromoSection | null;
  discount_banner?: DiscountBannerSection | null;
  feature_columns?: FeatureColumnsSection | null;
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
  pages?: Record<string, ContentPage> | null;
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
