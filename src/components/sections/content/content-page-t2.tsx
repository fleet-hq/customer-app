import Link from 'next/link';

import type { Tenant } from '@/lib/tenant';
import { withCompany } from '@/lib/tenant';
import type { ContentPage as ContentPageData, ContentBlock } from '@/services/companyContentServices';
import { paths } from '@/lib/paths';
import { contentPageSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/json-ld';
import { NapBlockT2 } from '@/components/sections/shared/nap-block-t2';
import { FaqT2 } from '@/components/sections/home-t2/faq-t2';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

interface ContentPageT2Props {
  tenant: Tenant;
  page: ContentPageData;
  path: string;
  showNap?: boolean;
}

/** Template-2 sibling of ContentPage — same generic block-content
 *  engine (headings, paragraphs, bullets, steps, links, FAQs, CTA),
 *  restyled with the t2 design tokens. Renders one unified layout for
 *  every `page.layout` value (default/about/contact); t2 doesn't yet
 *  have dedicated about/contact treatments the way template 1 does, so
 *  this stays deliberately generic rather than inventing new layouts. */
export function ContentPageT2({ tenant, page, path, showNap = true }: ContentPageT2Props) {
  const co = (t: string) => withCompany(t, tenant.name);
  const blocks = page.blocks ?? [];
  const cta = page.cta;
  const eyebrow = page.eyebrow === undefined ? tenant.name : page.eyebrow;

  return (
    <div className={styles.container}>
      <JsonLd data={contentPageSchema(tenant, page, path)} />

      <div className={styles.articleHead}>
        {page.breadcrumb?.length ? (
          <nav aria-label="Breadcrumb" className={styles.postMeta}>
            {page.breadcrumb.map((b, i) => (
              <span key={i}>
                {b.href && i < page.breadcrumb!.length - 1 ? (
                  <Link href={b.href}>{co(b.label || '')}</Link>
                ) : (
                  <span>{co(b.label || '')}</span>
                )}
                {i < page.breadcrumb!.length - 1 ? ' / ' : ''}
              </span>
            ))}
          </nav>
        ) : eyebrow ? (
          <p className={styles.eyebrow}>
            <Dyn>{co(eyebrow)}</Dyn>
          </p>
        ) : null}
        {page.h1 ? (
          <h1>
            <Dyn>{co(page.h1)}</Dyn>
          </h1>
        ) : null}
        {page.intro?.length ? (
          <div className={styles.articleIntro}>
            {page.intro.map((p, i) => (
              <p key={i}>
                <Dyn>{co(p)}</Dyn>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.articleBody}>
        {blocks.map((block, i) => (
          <BlockT2 key={i} block={block} co={co} />
        ))}

        {page.faqs?.length && !blocks.some((b) => b.faqs?.length) ? (
          <FaqT2 title="Frequently Asked Questions" items={page.faqs} />
        ) : null}

        {showNap ? <NapBlockT2 tenant={tenant} /> : null}
      </div>

      {cta && (cta.title || cta.description || cta.cta_label) ? (
        <div className={`${styles.cta} ${styles.section}`}>
          <div className={styles.container}>
            {cta.eyebrow ? (
              <p className={styles.eyebrow}>
                <Dyn>{co(cta.eyebrow)}</Dyn>
              </p>
            ) : null}
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

function BlockT2({ block, co }: { block: ContentBlock; co: (t: string) => string }) {
  if (block.faqs?.length) {
    return <FaqT2 title={block.heading ? co(block.heading) : 'Frequently Asked Questions'} items={block.faqs} />;
  }

  return (
    <div className={styles.articleSection}>
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

      {block.bullets?.length ? (
        <ul className={styles.articleBullets}>
          {block.bullets.map((b, j) => (
            <li key={j}>
              <Dyn>{co(b)}</Dyn>
            </li>
          ))}
        </ul>
      ) : null}

      {block.steps?.length ? (
        <ol className={styles.articleSteps}>
          {block.steps.map((step, j) => (
            <li key={j} className={styles.articleStep}>
              <span className={styles.articleStepNum}>{String(j + 1).padStart(2, '0')}</span>
              <p>
                <Dyn>{co(step)}</Dyn>
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      {block.link?.href ? (
        <Link href={block.link.href} className={`${styles.linkMore} ${styles.articleLink}`}>
          <Dyn>{co(block.link.label || 'Learn more')}</Dyn>
        </Link>
      ) : null}
    </div>
  );
}
