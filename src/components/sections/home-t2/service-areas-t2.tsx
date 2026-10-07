import Link from 'next/link';
import type { ContentLink } from '@/services/companyContentServices';
import { Dyn } from '@/components/i18n/Dyn';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface ServiceAreasT2Props {
  eyebrow?: string;
  title: string;
  description?: string;
  items: ContentLink[];
  ctaLabel?: string;
  ctaHref?: string;
}

/** Template-2 sibling of the service-areas section. Same data, same
 *  rules — areas with a page link to it, the rest render as plain text. */
export function ServiceAreasT2({
  eyebrow,
  title,
  description,
  items,
  ctaLabel,
  ctaHref,
}: ServiceAreasT2Props) {
  const areas = items.filter((a) => a.label?.trim());
  if (!title && !description && areas.length === 0) return null;

  return (
    <section className={styles.section} id="areas">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          {eyebrow ? (
            <p className={styles.eyebrow}>
              <Dyn>{eyebrow}</Dyn>
            </p>
          ) : null}
          {title ? (
            <h2>
              <Dyn>{title}</Dyn>
            </h2>
          ) : null}
          {description ? (
            <p>
              <Dyn>{description}</Dyn>
            </p>
          ) : null}
        </Reveal>

        {areas.length > 0 ? (
          <Reveal>
            <ul
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.6rem',
                listStyle: 'none',
                padding: 0,
                marginTop: '1.5rem',
              }}
            >
              {areas.map((area, i) => (
                <li key={`${area.label}-${i}`}>
                  {area.href ? (
                    <Link href={area.href} className={`${styles.btn} ${styles.btnGhost}`}>
                      <Dyn>{area.label ?? ''}</Dyn>
                    </Link>
                  ) : (
                    <span className={`${styles.btn} ${styles.btnGhost}`}>
                      <Dyn>{area.label ?? ''}</Dyn>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {ctaLabel && ctaHref ? (
          <Reveal>
            <div style={{ marginTop: '1.5rem' }}>
              <Link href={ctaHref} className={`${styles.btn} ${styles.btnBrass}`}>
                <Dyn>{ctaLabel}</Dyn>
              </Link>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
