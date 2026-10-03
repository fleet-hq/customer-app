import Link from 'next/link';

import type { Tenant } from '@/lib/tenant';
import { withCompany } from '@/lib/tenant';
import { paths } from '@/lib/paths';
import { serviceOverviewSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/json-ld';
import { NapBlockT2 } from '@/components/sections/shared/nap-block-t2';
import { Dyn } from '@/components/i18n/Dyn';
import type { ServicesBlock } from '@/services/companyContentServices';
import styles from '@/styles/template-2.module.css';

const SERVICES_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
];

interface ServicesPageT2Props {
  tenant: Tenant;
  h1: string;
  intro: string[];
  blocks: ServicesBlock[];
  cta?: { title?: string; description?: string; cta_label?: string; cta_href?: string };
}

/** Template-2 sibling of the /services page. Reads the exact same
 *  `tenant.sections.services` data as template 1 — no fallback copy. */
export function ServicesPageT2({ tenant, h1, intro, blocks, cta }: ServicesPageT2Props) {
  const co = (t: string) => withCompany(t, tenant.name);
  const isDirectory = blocks.filter((b) => b.href).length >= 2;

  return (
    <div className={styles.container}>
      <JsonLd data={serviceOverviewSchema(tenant, blocks, SERVICES_TRAIL)} />

      <div className={styles.articleHead}>
        <p className={styles.eyebrow}>
          <Dyn>{tenant.name}</Dyn>
        </p>
        {h1 ? (
          <h1>
            <Dyn>{co(h1)}</Dyn>
          </h1>
        ) : null}
        {intro.length ? (
          <div className={styles.articleIntro}>
            {intro.map((p, i) => (
              <p key={i}>
                <Dyn>{co(p)}</Dyn>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {isDirectory ? (
        <>
          <div className={styles.serviceGrid}>
            {blocks.map((block, i) => (
              <Link key={i} href={block.href || paths.fleet} className={styles.serviceCard}>
                <span className={styles.serviceNum}>{String(i + 1).padStart(2, '0')}</span>
                <h2>
                  <Dyn>{co(block.heading || '')}</Dyn>
                </h2>
                {block.paragraphs?.[0] ? <p>{co(block.paragraphs[0])}</p> : null}
                <span className={`${styles.linkMore}`}>
                  <Dyn>{co(block.link_label || 'Explore')}</Dyn>
                </span>
              </Link>
            ))}
          </div>
          <div className={styles.section}>
            <NapBlockT2 tenant={tenant} />
          </div>
        </>
      ) : (
        <div className={styles.articleBody}>
          {blocks.map((block, i) => {
            const hasSteps = !!block.steps?.length;
            return (
              <div key={i} className={styles.articleSection}>
                {block.heading ? (
                  <h2>
                    <Dyn>{co(block.heading)}</Dyn>
                  </h2>
                ) : null}
                {block.paragraphs?.length ? (
                  <div className={styles.articleParas}>
                    {block.paragraphs.map((p, j) => (
                      <p key={j}>
                        <Dyn>{co(p)}</Dyn>
                      </p>
                    ))}
                  </div>
                ) : null}
                {hasSteps ? (
                  <ol className={styles.articleSteps}>
                    {block.steps!.map((step, j) => (
                      <li key={j} className={styles.articleStep}>
                        <span className={styles.articleStepNum}>{String(j + 1).padStart(2, '0')}</span>
                        <p>
                          <Dyn>{co(step)}</Dyn>
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {block.bullets?.length ? (
                  <ul className={styles.articleBullets}>
                    {block.bullets.map((b, j) => (
                      <li key={j}>
                        <Dyn>{co(b)}</Dyn>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {block.href ? (
                  <Link href={block.href} className={`${styles.linkMore} ${styles.articleLink}`}>
                    <Dyn>{co(block.link_label || 'Learn more')}</Dyn>
                  </Link>
                ) : null}
              </div>
            );
          })}
          <NapBlockT2 tenant={tenant} />
        </div>
      )}

      {cta && (cta.title || cta.description || cta.cta_label) ? (
        <div className={`${styles.cta} ${styles.section}`}>
          <div className={styles.container}>
            <h2>
              <Dyn>{co(cta.title || 'Ready to book?')}</Dyn>
            </h2>
            {cta.description ? (
              <p>
                <Dyn>{co(cta.description)}</Dyn>
              </p>
            ) : null}
            <div className={styles.ctaActions}>
              <Link href={cta.cta_href || paths.fleet} className={`${styles.btn} ${styles.btnBrass}`}>
                <Dyn>{co(cta.cta_label || 'See available cars')}</Dyn>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
