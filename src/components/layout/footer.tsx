'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';
import { cn } from '@/lib/utils';
import { Mail, MapPin, Phone } from '@/components/ui/icons';

export function Footer() {
  const tenant = useTenant();

  return (
    <footer className="w-full bg-secondary text-white">
      <div className="mx-auto max-w-[1200px] px-6 pt-[60px] pb-[26px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr_1.4fr]">
          <div className="max-w-[340px]">
            <Image
              src={tenant.logoMono ?? tenant.logo}
              alt={tenant.name}
              width={412}
              height={412}
              className={cn('mb-4 h-12 w-auto', !tenant.logoMono && 'brightness-0 invert')}
            />
            <p className="mb-5 text-[11px] leading-[1.65] font-light text-white/60">{tenant.brandDesc}</p>
            <div className="flex gap-[10px]">
              {['X', 'Facebook', 'Instagram'].map((label) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-primary hover:bg-primary"
                >
                  <SocialGlyph label={label} />
                </a>
              ))}
            </div>
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
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-white/50 uppercase">
              Get in Touch
            </h4>
            <div className="flex flex-col gap-[13px]">
              <a href={`tel:${tenant.phone}`} className="flex items-center gap-[10px] text-[13px] text-white/80">
                <Phone size={15} className="flex-shrink-0 text-primary" />
                <span>{tenant.phone}</span>
              </a>
              <a href={`mailto:${tenant.email}`} className="flex items-center gap-[10px] text-[13px] break-all text-white/80">
                <Mail size={15} className="flex-shrink-0 text-primary" />
                <span>{tenant.email}</span>
              </a>
              <div className="flex items-start gap-[10px] text-[13px] text-white/80">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-primary" />
                <span className="leading-[1.5]">{tenant.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="my-[18px] mt-10 h-px bg-white/15" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12.5px] text-white/55">{tenant.copyright}</p>
          <p className="text-[12.5px] text-white/55">
            Powered by <span className="font-semibold text-white">FleetHQ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialGlyph({ label }: { label: string }) {
  if (label === 'X') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (label === 'Facebook') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
