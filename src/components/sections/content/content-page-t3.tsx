import Link from 'next/link';

import { Dyn } from '@/components/i18n/Dyn';
import { JsonLd } from '@/components/seo/json-ld';
import { FaqT3 } from '@/components/sections/home-t3/faq-t3';
import { NapBlockT3 } from '@/components/sections/shared/nap-block-t3';
import { paths } from '@/lib/paths';
import { contentPageSchema } from '@/lib/schema';
import { withCompany } from '@/lib/tenant';
import type { Tenant } from '@/lib/tenant';
import type {
  ContentBlock,
  ContentPage as ContentPageData,
} from '@/services/companyContentServices';

interface ContentPageT3Props {
  tenant: Tenant;
  page: ContentPageData;
  path: string;
  showNap?: boolean;
}

/** Template-3 sibling of ContentPage — the same generic block engine
 *  (headings, paragraphs, bullets, steps, links, FAQs, CTA) the other
 *  two templates render, in template 3's skin.
 *
 *  This is what every extra page a tenant buys is built from: they are
 *  data in `sections.pages`, not code, so a paying client's bespoke
 *  pages need no per-tenant components. */
export function ContentPageT3({ tenant, page, path, showNap = true }: ContentPageT3Props) {
  const co = (text: string) => withCompany(text, tenant.name);
  const blocks = page.blocks ?? [];
  const cta = page.cta;
  const eyebrow = page.eyebrow === undefined ? tenant.name : page.eyebrow;

  return (
    <>
      <main className="pg">
        <div className="wrap rule">
          <i className="x tl" />
          <i className="x tr" />
          <JsonLd data={contentPageSchema(tenant, page, path)} />

          <div className="art-head">
            {page.breadcrumb?.length ? (
              <nav aria-label="Breadcrumb" className="crumbs">
                {page.breadcrumb.map((crumb, i) => (
                  <span key={i}>
                    {crumb.href && i < page.breadcrumb!.length - 1 ? (
                      <Link href={crumb.href}>{co(crumb.label || '')}</Link>
                    ) : (
                      <span>{co(crumb.label || '')}</span>
                    )}
                    {i < page.breadcrumb!.length - 1 ? ' / ' : ''}
                  </span>
                ))}
              </nav>
            ) : eyebrow ? (
              <div className="eyebrow">
                <Dyn>{co(eyebrow)}</Dyn>
              </div>
            ) : null}

            {page.h1 ? (
              <h1>
                <Dyn>{co(page.h1)}</Dyn>
              </h1>
            ) : null}

            {page.intro?.length ? (
              <div className="art-intro">
                {page.intro.map((paragraph, i) => (
                  <p key={i}>
                    <Dyn>{co(paragraph)}</Dyn>
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="art-body">
            {blocks.map((block, i) => (
              <BlockT3 key={i} block={block} co={co} />
            ))}

            {page.faqs?.length && !blocks.some((b) => b.faqs?.length) ? (
              <FaqT3 title="Frequently Asked Questions" items={page.faqs} />
            ) : null}

            {showNap ? <NapBlockT3 tenant={tenant} /> : null}
          </div>
        </div>
      </main>

      {cta && (cta.title || cta.description || cta.cta_label) ? (
        <section className="cta">
          <div className="wrap">
            {cta.eyebrow ? (
              <div className="eyebrow">
                <Dyn>{co(cta.eyebrow)}</Dyn>
              </div>
            ) : null}
            <h2>
              <Dyn>{co(cta.title || 'Ready to book?')}</Dyn>
            </h2>
            {cta.description ? (
              <p className="cta-sub">
                <Dyn>{co(cta.description)}</Dyn>
              </p>
            ) : null}
            <div className="cta-actions">
              <Link className="btn" href={cta.cta_href || paths.fleet}>
                <Dyn>{co(cta.cta_label || 'See available cars')}</Dyn>{' '}
                <span className="chev">›</span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function BlockT3({ block, co }: { block: ContentBlock; co: (text: string) => string }) {
  if (block.faqs?.length) {
    return (
      <FaqT3
        title={block.heading ? co(block.heading) : 'Frequently Asked Questions'}
        items={block.faqs}
      />
    );
  }

  return (
    <div className="art-sec">
      {block.heading ? (
        <h2>
          <Dyn>{co(block.heading)}</Dyn>
        </h2>
      ) : null}

      {block.paragraphs?.length ? (
        <div className="art-paras">
          {block.paragraphs.map((paragraph, i) => (
            <p key={i}>
              <Dyn>{co(paragraph)}</Dyn>
            </p>
          ))}
        </div>
      ) : null}

      {block.bullets?.length ? (
        <ul className="art-bullets">
          {block.bullets.map((bullet, i) => (
            <li key={i}>
              <Dyn>{co(bullet)}</Dyn>
            </li>
          ))}
        </ul>
      ) : null}

      {block.steps?.length ? (
        <div className="steps art-steps">
          {block.steps.map((step, i) => (
            <div className="step" key={i}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <p>
                <Dyn>{co(step)}</Dyn>
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {block.link?.href ? (
        <Link className="btn ghost art-link" href={block.link.href}>
          <Dyn>{co(block.link.label || 'Learn more')}</Dyn> <span className="chev">›</span>
        </Link>
      ) : null}
    </div>
  );
}
