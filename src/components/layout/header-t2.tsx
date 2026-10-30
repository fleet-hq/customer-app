'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { useNavLinks } from '@/hooks/use-nav-links';
import { navDropdownFor } from '@/lib/nav-dropdowns';
import { paths } from '@/lib/paths';
import { telHref } from '@/lib/seo';
import { Close } from '@/components/ui/icons';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

function BrandMark() {
  return (
    <svg className={styles.brandMark} viewBox="0 0 120 120" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="60" cy="60" r="54" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="46" strokeWidth="1" opacity="0.45" />
      <circle cx="60" cy="32" r="5.5" fill="currentColor" stroke="none" />
      <path d="M33 67 L33 63 C33 57 37 55 42 55 L47 46 C49 42 53 40 59 40 L71 40 C78 40 82 43 86 49 L91 55 C95 56 96 60 96 63 L96 67" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45" cy="68" r="8" strokeWidth="2.5" />
      <circle cx="83" cy="68" r="8" strokeWidth="2.5" />
    </svg>
  );
}

/** Template-2 header. Same data contract as the template-1 Header
 *  (`tenant.name`, `tenant.brand.logo`, `tenant.brand.navLinks`,
 *  `footer.contact.phone`) so switching templates never needs new
 *  operator-supplied fields. */
export function HeaderT2({ minimal = false }: { minimal?: boolean } = {}) {
  const tenant = useTenant();
  const navLinks = useNavLinks();
  const [open, setOpen] = useState(false);
  const phone = tenant.footer.contact.phone;
  // Same rule as template 1: a nav item pointing at an overview page
  // expands to that page's linked sections.
  const dropdownFor = (href: string) => navDropdownFor(tenant, href);

  return (
    <header className={`no-print ${styles.nav}`}>
      <div className={styles.navInner}>
        <Link href={paths.home} className={styles.brand} onClick={() => setOpen(false)}>
          {tenant.brand.logo ? (
            <Image src={tenant.brand.logo} alt={tenant.name} width={38} height={38} className="h-9.5 w-9.5 object-contain" unoptimized />
          ) : (
            <BrandMark />
          )}
          <span className={styles.brandName}>{tenant.name}</span>
        </Link>

        {/* A landing page has one job. Navigation away from it is the
            opposite of that, so the menu and the secondary actions go,
            leaving the logo, the phone number and one button. */}
        {minimal ? null : (
        <nav aria-label="Primary" className={open ? styles.navOpen : undefined}>
          <ul className={styles.navLinks}>
            {navLinks.map((link) => {
              const children = dropdownFor(link.href);
              if (!children.length) {
                return (
                  <li key={link.href}>
                    <Link href={link.href} onClick={() => setOpen(false)}>
                      <Dyn>{link.label}</Dyn>
                    </Link>
                  </li>
                );
              }
              return (
                <li key={link.href} className={styles.navHasChildren}>
                  <Link href={link.href} onClick={() => setOpen(false)} aria-haspopup="true">
                    <Dyn>{link.label}</Dyn>
                    <span aria-hidden="true" className={styles.navCaret}>
                      ▾
                    </span>
                  </Link>
                  <ul className={styles.navDropdown}>
                    {children.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} onClick={() => setOpen(false)}>
                          <Dyn>{child.label}</Dyn>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
            <li className={styles.navMenuOnly}>
              <Link href={paths.manage} onClick={() => setOpen(false)}>
                <Dyn>Manage Bookings</Dyn>
              </Link>
            </li>
          </ul>
        </nav>
        )}

        <div className={styles.navCta}>
          {phone ? (
            <a href={telHref(phone) ?? undefined} className={styles.navPhone}>
              {phone}
            </a>
          ) : null}
          {minimal ? null : (
            <Link href={paths.manage} className={`${styles.btn} ${styles.btnGhost} ${styles.navManage}`} onClick={() => setOpen(false)}>
              <Dyn>Manage Bookings</Dyn>
            </Link>
          )}
          <Link href={paths.fleet} className={`${styles.btn} ${styles.btnBrass}`}>
            <Dyn>Book now</Dyn>
          </Link>
          {minimal ? null : (
          <button
            type="button"
            className={styles.navToggle}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <Close size={16} /> : '☰'}
          </button>
          )}
        </div>
      </div>
    </header>
  );
}
