'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';
import { Mail, MapPin, Phone } from '@/components/ui/icons';
import { Dyn } from '@/components/i18n/Dyn';
import { SocialGlyph } from '@/components/layout/social-glyph';

const DEFAULT_EXPLORE_LINKS = [
  { label: 'About Us', href: `${paths.home}#about` },
  { label: 'Our Fleet', href: paths.fleet },
  { label: 'FAQs', href: `${paths.home}#faqs` },
  { label: 'Privacy', href: paths.privacy },
];

export function Footer() {
  const tenant = useTenant();
  const { brand, footer } = tenant;
  // Prefer admin-supplied footer copy, fall back to the brand descriptor.
  const description = footer.description || brand.description;
  // Render only the socials the operator added — no placeholder icons.
  const socials = footer.socials;
  // Tenants with extra content pages list them here; everyone else keeps
  // the standard four so no site loses its footer nav.
  const configured = (tenant.sections.footerLinks ?? [])
    .filter((l): l is { label: string; href: string } => !!l.href && !!l.label);
  const exploreLinks = configured.length > 0 ? configured : DEFAULT_EXPLORE_LINKS;

  return (
    <footer className="no-print w-full bg-secondary text-white">
      <div className="mx-auto max-w-[1200px] px-6 pt-[60px] pb-[26px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr_1.4fr]">
          <div className="max-w-[340px]">
            {brand.logoMono ? (
              <Image
                src={brand.logoMono}
                alt={tenant.name}
                width={412}
                height={412}
                className="mb-4 h-12 w-auto"
                unoptimized
              />
            ) : null}
            {description ? (
              <p className={`mb-5 text-[11px] leading-[1.65] font-light text-white/60${brand.logoMono ? '' : ' mt-8'}`}>{description}</p>
            ) : null}
            {socials.length > 0 ? (
              <div className="flex gap-[10px]">
                {socials.map((s) => (
                  <a
                    key={`${s.platform}-${s.url}`}
                    href={s.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-primary hover:bg-primary"
                  >
                    <SocialGlyph label={s.platform} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-white/50 uppercase">
              <Dyn>Explore</Dyn>
            </h4>
            <nav className="flex flex-col gap-3">
              {exploreLinks.map((l) => (
                <Link
                  key={`${l.label}-${l.href}`}
                  href={l.href}
                  className="text-[13px] text-white/80 transition-colors hover:text-footer-hover"
                >
                  <Dyn>{l.label}</Dyn>
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-white/50 uppercase">
              <Dyn>Get in Touch</Dyn>
            </h4>
            <div className="flex flex-col gap-[13px]">
              {footer.contact.phone ? (
                <a href={`tel:${footer.contact.phone}`} className="flex items-center gap-[10px] text-[13px] text-white/80">
                  <Phone size={15} className="flex-shrink-0 text-primary" />
                  <span>{footer.contact.phone}</span>
                </a>
              ) : null}
              {footer.contact.email ? (
                <a href={`mailto:${footer.contact.email}`} className="flex items-center gap-[10px] text-[13px] break-all text-white/80">
                  <Mail size={15} className="flex-shrink-0 text-primary" />
                  <span>{footer.contact.email}</span>
                </a>
              ) : null}
              {footer.contact.address ? (
                <div className="flex items-start gap-[10px] text-[13px] text-white/80">
                  <MapPin size={15} className="mt-0.5 flex-shrink-0 text-primary" />
                  <span className="leading-[1.5]">{footer.contact.address}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="my-[18px] mt-10 h-px bg-white/15" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12.5px] text-white/55">{brand.copyright}</p>
          <p className="text-[12.5px] text-white/55">
            Powered by <span className="font-semibold text-white">FleetHQ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
