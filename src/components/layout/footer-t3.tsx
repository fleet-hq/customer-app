'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { SocialLinks } from '@/components/layout/social-glyph';
import { paths } from '@/lib/paths';
import { telHref } from '@/lib/seo';
import { useTenant } from '@/lib/tenant-context';

/** Ported from the raw template's footer, with every hardcoded Zenith
 *  value replaced by the tenant's own. Columns render only when they
 *  have something in them — a company with no socials or no address
 *  gets a tighter footer rather than an empty heading. */
export function FooterT3({ minimal = false }: { minimal?: boolean }) {
  const tenant = useTenant();
  const { contact, socials, description } = tenant.footer;
  const phone = telHref(contact.phone);
  const email = contact.email ? `mailto:${contact.email}` : null;
  const maps = contact.address
    ? `https://maps.google.com/?q=${encodeURIComponent(contact.address)}`
    : null;
  const year = new Date().getFullYear();

  return (
    <footer className="dark" id="contact">
      <div className="wrap">
        <i className="x tl" />
        <i className="x tr" />

        {minimal ? null : (
          <div className="f-grid">
            <div>
              <Link className="logo" href={paths.home}>
                {tenant.brand.logo ? (
                  <Image
                    src={tenant.brand.logo}
                    alt={tenant.name}
                    width={200}
                    height={44}
                    unoptimized
                  />
                ) : (
                  <span className="logo-word">{tenant.name}</span>
                )}
              </Link>
              {description ? (
                <p className="f-about">
                  <Dyn>{description}</Dyn>
                </p>
              ) : null}
              <SocialLinks socials={socials} className="soc" />
            </div>

            <div>
              <h4>
                <Dyn>Explore</Dyn>
              </h4>
              <ul>
                <li>
                  <Link href={paths.fleet}>
                    <Dyn>The fleet</Dyn>
                  </Link>
                </li>
                <li>
                  <Link href={paths.manage}>
                    <Dyn>Manage booking</Dyn>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4>
                <Dyn>Company</Dyn>
              </h4>
              <ul>
                <li>
                  <Link href={paths.terms}>
                    <Dyn>Terms</Dyn>
                  </Link>
                </li>
                <li>
                  <Link href={paths.privacy}>
                    <Dyn>Privacy Policy</Dyn>
                  </Link>
                </li>
              </ul>
            </div>

            {phone || email || maps ? (
              <div>
                <h4>
                  <Dyn>Contact</Dyn>
                </h4>
                <ul>
                  {maps ? (
                    <li>
                      <a href={maps} target="_blank" rel="noopener noreferrer">
                        {contact.address}
                      </a>
                    </li>
                  ) : null}
                  {phone ? (
                    <li>
                      <a href={phone}>{contact.phone}</a>
                    </li>
                  ) : null}
                  {email ? (
                    <li>
                      <a href={email}>{contact.email}</a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <div className="f-bot">
          <span>
            © {year} {tenant.brand.copyright || tenant.name}
          </span>
          <span className="f-legal">
            <Link href={paths.privacy}>
              <Dyn>Privacy Policy</Dyn>
            </Link>
            <Link href={paths.terms}>
              <Dyn>Terms &amp; Conditions</Dyn>
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
