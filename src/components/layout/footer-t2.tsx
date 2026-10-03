'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

/** Template-2 footer. Same fields as the template-1 Footer
 *  (`brand.logoMono`/`brand.description`, `footer.description`,
 *  `footer.socials`, `footer.contact.*`) — nothing new to configure. */
export function FooterT2() {
  const tenant = useTenant();
  const { brand, footer } = tenant;
  const description = footer.description || brand.description;
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.container}>
        <div className={styles.footerTop}>
          <div>
            <div className={styles.brand}>
              {brand.logoMono ? (
                <Image src={brand.logoMono} alt={tenant.name} width={38} height={38} className="h-9.5 w-9.5 object-contain" unoptimized />
              ) : null}
              <span className={styles.brandName}>{tenant.name}</span>
            </div>
            {description ? <p className={styles.footerBlurb}>{description}</p> : null}
          </div>

          <div className={styles.fcol}>
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
                <Link href={paths.home}>
                  <Dyn>About us</Dyn>
                </Link>
              </li>
              <li>
                <Link href={paths.terms}>
                  <Dyn>Terms</Dyn>
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.fcol}>
            <h4>
              <Dyn>Company</Dyn>
            </h4>
            <ul>
              <li>
                <Link href={paths.inquiry}>
                  <Dyn>Partner with us</Dyn>
                </Link>
              </li>
              <li>
                <Link href={paths.manage}>
                  <Dyn>Manage booking</Dyn>
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.fcol}>
            <h4>
              <Dyn>Contact</Dyn>
            </h4>
            <ul>
              {footer.contact.address ? (
                <li>
                  <span>{footer.contact.address}</span>
                </li>
              ) : null}
              {footer.contact.phone ? (
                <li>
                  <a href={`tel:${footer.contact.phone}`}>{footer.contact.phone}</a>
                </li>
              ) : null}
              {footer.contact.email ? (
                <li>
                  <a href={`mailto:${footer.contact.email}`}>{footer.contact.email}</a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>
            © {year} {tenant.name}
            {brand.copyright ? ` — ${brand.copyright}` : ''}
          </span>
          <span>
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
