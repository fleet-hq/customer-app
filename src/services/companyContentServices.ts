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

export interface HeroSection {
  pill?: string;
  heading_lines?: string[];
  subheading?: string;
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
