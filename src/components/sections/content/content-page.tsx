import Link from 'next/link';

import type { Tenant } from '@/lib/tenant';
import { withCompany } from '@/lib/tenant';
import type { ContentPage as ContentPageData, ContentBlock } from '@/services/companyContentServices';
import { paths } from '@/lib/paths';
import { tenantWhatsapp } from '@/lib/seo';
import { contentPageSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/json-ld';
import { NapBlock } from '@/components/sections/shared/nap-block';
import { BrandCta } from '@/components/sections/shared/brand-cta';
import { ContentFaq } from './content-faq';
import { ArrowRight } from '@/components/ui/icons';

interface ContentPageProps {
  tenant: Tenant;
  page: ContentPageData;
  path: string;
  headerSlot?: React.ReactNode;
}

export function ContentPage({ tenant, page, path, headerSlot }: ContentPageProps) {
  const co = (t: string) => withCompany(t, tenant.name);
  const blocks = page.blocks ?? [];
  const cta = page.cta;
  const wa = tenantWhatsapp(tenant);
  const eyebrow = page.eyebrow || tenant.name;

  let stepNo = 0;

  return (
    <div className="bg-white text-ink">
      <JsonLd data={contentPageSchema(tenant, page, path)} />

      <section className="relative overflow-hidden border-b border-hairline bg-subtle">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(85% 120% at 88% -10%, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 58%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-[860px] px-4 pt-[52px] pb-[44px] sm:px-6 sm:pt-[68px] sm:pb-[52px]">
          {page.breadcrumb?.length ? (
            <nav aria-label="Breadcrumb" className="mb-[18px] flex flex-wrap items-center gap-[7px] text-[12.5px] text-muted">
              {page.breadcrumb.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-[7px]">
                  {b.href && i < page.breadcrumb!.length - 1 ? (
                    <Link href={b.href} className="hover:text-primary">
                      {co(b.label || '')}
                    </Link>
                  ) : (
                    <span className="text-label">{co(b.label || '')}</span>
                  )}
                  {i < page.breadcrumb!.length - 1 ? <span className="text-card-border">/</span> : null}
                </span>
              ))}
            </nav>
          ) : (
            <span className="inline-flex items-center rounded-full border border-primary-border bg-white px-[13px] py-[6px] text-[11.5px] font-semibold uppercase tracking-[0.06em] text-primary">
              {co(eyebrow)}
            </span>
          )}
          {page.h1 ? (
            <h1 className="mt-[18px] font-manrope text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-ink text-balance sm:text-[46px]">
              {co(page.h1)}
            </h1>
          ) : null}
          {page.intro?.length ? (
            <div className="mt-[16px] flex max-w-[640px] flex-col gap-[12px]">
              {page.intro.map((p, i) => (
                <p key={i} className="text-[16.5px] leading-[1.7] text-muted">
                  {co(p)}
                </p>
              ))}
            </div>
          ) : null}
          {headerSlot ? <div className="mt-[28px]">{headerSlot}</div> : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[860px] px-4 pt-[44px] pb-[24px] sm:px-6 sm:pt-[56px]">
        <div className="flex flex-col gap-[20px]">
          {blocks.map((block, i) => {
            const n = block.is_step ? ++stepNo : 0;
            return <Block key={i} block={block} stepNo={n} co={co} />;
          })}

          {page.faqs?.length ? (
            <div className="rounded-[20px] border border-card-border bg-white p-[26px] sm:p-[34px]">
              <ContentFaq title="Frequently Asked Questions" items={page.faqs} />
            </div>
          ) : null}

          <NapBlock tenant={tenant} />
        </div>

        {cta && (cta.title || cta.description || cta.cta_label) ? (
          <div className="mt-[40px]">
            {cta.whatsapp && wa ? (
              <div className="relative overflow-hidden rounded-[22px] bg-secondary px-[32px] py-[48px] text-center sm:py-[60px]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  aria-hidden="true"
                  style={{
                    background:
                      'radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, var(--color-primary) 55%, transparent) 0%, transparent 55%)',
                  }}
                />
                <div className="relative mx-auto max-w-[620px]">
                  <h2 className="m-0 mb-[14px] font-manrope text-[27px] leading-[1.15] font-bold tracking-[-0.02em] text-white sm:text-[32px]">
                    {co(cta.title || 'Ready to Book?')}
                  </h2>
                  {cta.description ? (
                    <p className="m-0 mb-[28px] text-[14.5px] leading-[1.65] text-white/85">{co(cta.description)}</p>
                  ) : (
                    <div className="mb-[28px]" />
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-[12px]">
                    <Link
                      href={cta.cta_href || paths.fleet}
                      className="inline-flex items-center gap-[9px] rounded-full bg-white px-[30px] py-[14px] text-[15px] font-semibold text-ink transition-transform hover:-translate-y-[1px]"
                    >
                      {co(cta.cta_label || 'See available cars')}
                      <ArrowRight size={17} />
                    </Link>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-[9px] rounded-full border border-white/45 px-[30px] py-[14px] text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      WhatsApp us
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <BrandCta
                eyebrow={cta.eyebrow ? co(cta.eyebrow) : undefined}
                title={co(cta.title || 'Ready to book?')}
                description={cta.description ? co(cta.description) : undefined}
                ctaLabel={co(cta.cta_label || 'See available cars')}
                ctaHref={cta.cta_href || paths.fleet}
              />
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Block({
  block,
  stepNo,
  co,
}: {
  block: ContentBlock;
  stepNo: number;
  co: (t: string) => string;
}) {
  const hasSteps = !!block.steps?.length;
  return (
    <div
      className={
        'rounded-[20px] border border-card-border p-[26px] sm:p-[34px] ' +
        (hasSteps ? 'bg-subtle' : 'bg-white')
      }
    >
      {block.heading ? (
        <div className="mb-[18px] flex items-center gap-[12px]">
          {stepNo ? (
            <span className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full bg-primary font-manrope text-[13px] font-bold text-white">
              {stepNo}
            </span>
          ) : (
            <span className="h-[22px] w-[4px] flex-shrink-0 rounded-full bg-primary" />
          )}
          <h2 className="font-manrope text-[22px] font-bold leading-[1.25] tracking-[-0.01em] text-ink sm:text-[24px]">
            {co(block.heading)}
          </h2>
        </div>
      ) : null}

      {block.paragraphs?.length ? (
        <div className="flex flex-col gap-[12px] pl-[16px]">
          {block.paragraphs.map((p, j) => (
            <p key={j} className="text-[16px] leading-[1.75] text-label">
              {co(p)}
            </p>
          ))}
        </div>
      ) : null}

      {block.bullets?.length ? (
        <ul className="mt-[16px] flex flex-col gap-[10px] pl-[16px]">
          {block.bullets.map((b, j) => (
            <li key={j} className="flex gap-[12px] text-[16px] leading-[1.6] text-label">
              <span className="mt-[9px] h-[6px] w-[6px] flex-shrink-0 rounded-full bg-primary" />
              <span>{co(b)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {hasSteps ? (
        <ol className="mt-[4px] flex flex-col gap-[4px] pl-[16px]">
          {block.steps!.map((step, j) => (
            <li key={j} className="flex gap-[16px]">
              <div className="flex flex-col items-center">
                <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-primary font-manrope text-[14px] font-bold text-white">
                  {j + 1}
                </span>
                {j < block.steps!.length - 1 ? (
                  <span className="my-[4px] w-[2px] flex-1 rounded-full bg-primary-border" />
                ) : null}
              </div>
              <p className="pt-[5px] pb-[16px] text-[16px] leading-[1.65] text-label">{co(step)}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {block.link?.href ? (
        <div className="mt-[18px] pl-[16px]">
          <Link
            href={block.link.href}
            className="inline-flex items-center gap-[7px] text-[14.5px] font-semibold text-primary hover:gap-[10px]"
          >
            {co(block.link.label || 'Learn more')}
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
