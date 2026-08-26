'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';
import { Mail, MapPin, Phone } from '@/components/ui/icons';

export function Footer() {
  const tenant = useTenant();
  const { brand, footer } = tenant;
  // Prefer admin-supplied footer copy, fall back to the brand descriptor.
  const description = footer.description || brand.description;
  // Render only the socials the operator added — no placeholder icons.
  const socials = footer.socials;

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
              <p className="mb-5 text-[11px] leading-[1.65] font-light text-white/60">{description}</p>
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
              Explore
            </h4>
            <nav className="flex flex-col gap-3">
              <Link href={`${paths.home}#about`} className="text-[13px] text-white/80 transition-colors hover:text-footer-hover">
                About Us
              </Link>
              <Link href={paths.fleet} className="text-[13px] text-white/80 transition-colors hover:text-footer-hover">
                Our Fleet
              </Link>
              <Link href={`${paths.home}#faqs`} className="text-[13px] text-white/80 transition-colors hover:text-footer-hover">
                FAQs
              </Link>
              <Link href={paths.privacy} className="text-[13px] text-white/80 transition-colors hover:text-footer-hover">
                Privacy
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-white/50 uppercase">
              Get in Touch
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

function SocialGlyph({ label }: { label: string }) {
  const key = label.toLowerCase().trim();

  if (key === 'x' || key === 'twitter') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (key === 'facebook') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
    );
  }
  if (key === 'instagram') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (key === 'youtube') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z" />
      </svg>
    );
  }
  if (key === 'tiktok') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.6 6.3a5.5 5.5 0 0 1-3.6-1.4 5.7 5.7 0 0 1-1.7-3.4h-3.1v13a3 3 0 1 1-3-3v-3.2a6.2 6.2 0 1 0 6.2 6.2V9.4a8.7 8.7 0 0 0 5.2 1.7z" />
      </svg>
    );
  }
  if (key === 'linkedin') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.45 20.45h-3.55v-5.56c0-1.32-.02-3.03-1.85-3.03-1.85 0-2.14 1.44-2.14 2.93v5.66H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.44a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    );
  }
  if (key === 'pinterest') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.1 9.4 7.6 11.2-.1-.9-.2-2.4 0-3.4l1.4-6s-.4-.7-.4-1.8c0-1.6 1-2.8 2.2-2.8 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.1 1.8 2.1 2.1 0 3.7-2.2 3.7-5.5 0-2.9-2.1-4.9-5-4.9-3.4 0-5.4 2.5-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3-.1.4-.3 1.2-.4 1.4-.1.2-.2.3-.4.2-1.7-.8-2.7-3.2-2.7-5.2 0-4.2 3-8.1 8.7-8.1 4.6 0 8.1 3.3 8.1 7.6 0 4.5-2.9 8.2-6.9 8.2-1.3 0-2.6-.7-3-1.5l-.8 3.2c-.3 1.2-1.1 2.6-1.7 3.5C9.6 23.8 10.8 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z" />
      </svg>
    );
  }
  if (key === 'snapchat') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.2 0h.1c1.4 0 4.4.4 5.9 3.7.5 1.1.4 3 .3 4.5v.1c0 .2 0 .3-.1.5.1 0 .3.1.4.1.3 0 .6-.1.9-.2.1-.1.3-.1.5-.1s.3 0 .5.1c.7.2 1 .8 1 1.2 0 .6-.6 1-1.5 1.4-.1 0-.3.1-.5.2-.6.2-1.4.6-1.7 1.2-.2.3-.1.7 0 1.2.1.1 3 6.1 8.8 7 .3.1.5.3.5.5 0 .1 0 .2-.1.3-.4.9-2.1 1.6-5.1 2.1-.1.1-.2.5-.3 1-.1.3-.1.6-.2.9-.1.4-.4.6-.9.6-.2 0-.4 0-.6-.1-.5-.1-.9-.1-1.4-.1-.3 0-.6 0-.9.1-.6.1-1.1.4-1.7.8-.9.5-1.8 1.1-3.2 1.1s-2.4-.6-3.2-1.1c-.6-.4-1.1-.7-1.7-.8-.3 0-.6-.1-.9-.1-.5 0-.9 0-1.4.1-.3.1-.5.1-.6.1-.6 0-.9-.4-1-.7-.1-.3-.1-.5-.2-.8-.1-.5-.2-.9-.3-1-3-.4-4.7-1.1-5.1-2.1V16c0-.2.2-.4.5-.5 5.8-1 8.7-7 8.8-7 .1-.4.2-.9 0-1.2-.3-.6-1.1-1-1.7-1.2-.1-.1-.3-.1-.4-.1-1.1-.4-1.6-.9-1.6-1.4 0-.4.3-.9 1-1.2.2-.1.4-.1.6-.1s.4 0 .5.1c.3.1.6.2.9.2.1 0 .3 0 .5-.1v-.6c-.1-1.5-.2-3.4.3-4.5C7.8.4 10.8 0 12.2 0z" />
      </svg>
    );
  }
  if (key === 'threads') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.2 24c-3.5 0-6.5-1.2-8.5-3.5C1.5 18 .4 15 .4 12s1.1-6 3.3-8.5C5.7 1.2 8.7 0 12.2 0c3.5 0 6.5 1.2 8.5 3.5 2.2 2.5 3.3 5.5 3.3 8.5v0c0 3-1.1 6-3.3 8.5-2 2.3-5 3.5-8.5 3.5zm.1-19.6c-2.7 0-5 .9-6.6 2.8C4.2 8.8 3.4 10.4 3.4 12s.8 3.2 2.3 4.8c1.6 1.9 3.9 2.8 6.6 2.8 2.7 0 5-.9 6.6-2.8 1.5-1.6 2.3-3.2 2.3-4.8s-.8-3.2-2.3-4.8c-1.6-1.9-3.9-2.8-6.6-2.8zm.9 10.9c-1.2 0-2.2-.4-2.9-1.2-.4-.4-.7-.9-.8-1.6h1.4c.2.6.7 1.1 1.6 1.4.5.1 1 .2 1.5.1.5-.1.9-.3 1.2-.6.3-.3.4-.6.4-.9 0-.6-.4-1-1.2-1.2h-.1c-.2 0-.5-.1-.8-.1-.9-.1-1.6-.3-2.1-.5-.6-.3-.8-.7-.8-1.3 0-.4.2-.7.5-1s.7-.4 1.2-.4c.6 0 1.1.2 1.5.5.4.3.6.7.7 1.1h1.3c-.1-.6-.4-1.2-.9-1.7-.7-.6-1.5-.9-2.5-.9-.8 0-1.4.2-2 .5-.5.3-.9.8-1 1.4-.1.5-.1 1 .2 1.5.3.5.8.9 1.5 1 .4.1.9.2 1.4.2.4 0 .7.1 1 .1.4.1.6.3.7.7.1.3-.1.7-.5 1-.4.3-.9.4-1.5.4z" />
      </svg>
    );
  }
  if (key === 'whatsapp') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.3-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5H7.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3zM12 22.2c-1.7 0-3.4-.5-4.9-1.3l-.3-.2-3.6 1 1-3.5-.2-.3A9.1 9.1 0 1 1 12 22.2zM12 1.6a10.4 10.4 0 0 0-8.9 15.8L1.6 22.4l5.1-1.4A10.4 10.4 0 0 0 22.4 12 10.4 10.4 0 0 0 12 1.6z" />
      </svg>
    );
  }
  if (key === 'globe' || key === 'website' || key === 'web') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </svg>
  );
}
