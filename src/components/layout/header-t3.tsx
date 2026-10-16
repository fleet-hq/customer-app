'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';
import { telHref } from '@/lib/seo';
import { useTenant } from '@/lib/tenant-context';

/** The raw template hardcoded Zenith's links, phone and logo; all three
 *  come from the tenant here, so the same markup serves any company.
 *
 *  It also dropped the nav entirely below 860px with nothing to replace
 *  it, leaving phones with no way to reach any page but the two
 *  buttons. The burger and `.navlinks.open` panel are additions for
 *  that reason, styled alongside the port rather than inside it.
 *
 *  `minimal` strips this to logo + phone + one action for landing
 *  pages, matching how template 2's header behaves on an advert
 *  destination. */
export function HeaderT3({ minimal = false }: { minimal?: boolean }) {
  const tenant = useTenant();
  const [open, setOpen] = useState(false);
  const phone = telHref(tenant.footer.contact.phone);
  const links = minimal ? [] : tenant.brand.navLinks;

  return (
    <nav>
      <div className="wrap">
        <Link className="logo" href={paths.home} onClick={() => setOpen(false)}>
          {tenant.brand.logo ? (
            <Image
              src={tenant.brand.logo}
              alt={tenant.name}
              width={160}
              height={34}
              priority
              unoptimized
            />
          ) : (
            <span className="logo-word">{tenant.name}</span>
          )}
        </Link>

        {links.length > 0 ? (
          <div className={open ? 'navlinks open' : 'navlinks'}>
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                <Dyn>{link.label}</Dyn>
              </Link>
            ))}
          </div>
        ) : null}

        {phone ? (
          <a className="navphone" href={phone}>
            {tenant.footer.contact.phone}
          </a>
        ) : null}

        {!minimal ? (
          <Link className="btn ghost nav-mb" href={paths.manage}>
            <Dyn>Manage Bookings</Dyn>
          </Link>
        ) : null}

        <Link className="btn" href={paths.fleet}>
          <Dyn>Book now</Dyn> <span className="chev">›</span>
        </Link>

        {links.length > 0 ? (
          <button
            type="button"
            className="nav-burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        ) : null}
      </div>
    </nav>
  );
}
