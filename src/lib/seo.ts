import type { Metadata } from 'next';

import type { Tenant } from './tenant';

export function siteOrigin(tenant: Tenant): string {
  const bare = (tenant.domain || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/^www\./, '');
  return bare ? `https://www.${bare}` : '';
}

export function absoluteUrl(tenant: Tenant, pathOrUrl?: string | null): string {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = siteOrigin(tenant);
  if (!origin) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function whatsappHref(rawNumber?: string | null): string | null {
  if (!rawNumber) return null;
  const digits = rawNumber.replace(/\D/g, '');
  if (!digits) return null;
  const intl = digits.length === 10 ? `1${digits}` : digits;
  return `https://wa.me/${intl}`;
}

export function tenantWhatsapp(tenant: Tenant): string | null {
  return whatsappHref(tenant.sections.seo?.whatsapp_number || tenant.footer.contact.phone || null);
}

export interface PageMetaInput {
  tenant: Tenant;
  path: string;
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  canonical?: string;
  noindex?: boolean;
}

export function pageMetadata(input: PageMetaInput): Metadata {
  const { tenant, path, title, description, ogTitle, ogDescription, ogImage, ogImageAlt, canonical, noindex } =
    input;
  const seo = tenant.sections.seo;
  const canonicalUrl = canonical || absoluteUrl(tenant, path);
  const siteName = seo?.og_site_name || tenant.name;
  const image = absoluteUrl(tenant, ogImage || seo?.default_og_image);
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;

  const meta: Metadata = {
    title,
    description,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    openGraph: {
      type: 'website',
      siteName,
      locale: 'en_US',
      url: canonicalUrl || undefined,
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images: image ? [{ url: image, width: 1200, height: 630, alt: ogImageAlt || resolvedOgTitle }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images: image ? [image] : undefined,
    },
  };

  if (seo?.geo_region || seo?.geo_placename) {
    meta.other = {
      ...(seo.geo_region ? { 'geo.region': seo.geo_region } : {}),
      ...(seo.geo_placename ? { 'geo.placename': seo.geo_placename } : {}),
    };
  }

  return meta;
}
