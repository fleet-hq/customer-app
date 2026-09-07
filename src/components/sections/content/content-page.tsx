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
import { AboutLayout } from './about-layout';
import { ContactLayout } from './contact-layout';
import { ArrowRight, Check, Car, ShieldCheck, MapPin, Info } from '@/components/ui/icons';

const RICH_ICONS = [Car, ShieldCheck, MapPin, Info];

interface ContentPageProps {
  tenant: Tenant;
  page: ContentPageData;
  path: string;
  heroImage?: string | null;
  afterHero?: React.ReactNode;
  searchOverlap?: boolean;
  richBlocks?: boolean;
}

export function ContentPage({ tenant, page, path, heroImage, afterHero, searchOverlap, richBlocks }: ContentPageProps) {
  if (page.layout === 'about') return <AboutLayout tenant={tenant} page={page} path={path} />;
  if (page.layout === 'contact') return <ContactLayout tenant={tenant} page={page} path={path} />;
  const co = (t: string) => withCompany(t, tenant.name);
  const blocks = page.blocks ?? [];
  const cta = page.cta;
  const wa = tenantWhatsapp(tenant);
  const eyebrow = page.eyebrow || tenant.name;
  const onImage = !!heroImage;

  let stepNo = 0;

  return (
    <div className="bg-white text-ink">
      <JsonLd data={contentPageSchema(tenant, page, path)} />

      <section
        className={
          'relative overflow-hidden border-b border-hairline ' + (onImage ? 'bg-secondary' : 'bg-subtle')
        }
      >
        {onImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              aria-hidden="true"
              style={{ backgroundImage: `url('${heroImage}')` }}
            />
            <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(85% 120% at 88% -10%, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 58%)',
            }}
          />
        )}
        <div
          className={
            'relative mx-auto w-full max-w-[860px] px-4 pt-[52px] sm:px-6 sm:pt-[68px] ' +
            (searchOverlap ? 'pb-[92px] sm:pb-[108px] ' : 'pb-[44px] sm:pb-[52px] ') +
            (onImage ? 'flex min-h-[440px] flex-col justify-center sm:min-h-[500px]' : '')
          }
        >
          {page.breadcrumb?.length ? (
            <nav
              aria-label="Breadcrumb"
              className={
                'mb-[18px] flex flex-wrap items-center gap-[7px] text-[12.5px] ' +
                (onImage ? 'text-white/70' : 'text-muted')
              }
            >
              {page.breadcrumb.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-[7px]">
                  {b.href && i < page.breadcrumb!.length - 1 ? (
                    <Link href={b.href} className="hover:text-primary">
                      {co(b.label || '')}
                    </Link>
                  ) : (
                    <span className={onImage ? 'text-white' : 'text-label'}>{co(b.label || '')}</span>
                  )}
                  {i < page.breadcrumb!.length - 1 ? (
                    <span className={onImage ? 'text-white/40' : 'text-card-border'}>/</span>
                  ) : null}
                </span>
              ))}
            </nav>
          ) : (
            <span
              className={
                'inline-flex items-center rounded-full px-[13px] py-[6px] text-[11.5px] font-semibold uppercase tracking-[0.06em] ' +
                (onImage
                  ? 'border border-white/25 bg-white/10 text-white backdrop-blur-sm'
                  : 'border border-primary-border bg-white text-primary')
              }
            >
              {co(eyebrow)}
            </span>
          )}
          {page.h1 ? (
            <h1
              className={
                'mt-[18px] font-manrope text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-balance sm:text-[46px] ' +
                (onImage ? 'text-white' : 'text-ink')
              }
            >
              {co(page.h1)}
            </h1>
          ) : null}
          {page.intro?.length ? (
            <div className="mt-[16px] flex max-w-[640px] flex-col gap-[12px]">
              {page.intro.map((p, i) => (
                <p
                  key={i}
                  className={'text-[16.5px] leading-[1.7] ' + (onImage ? 'text-white/85' : 'text-muted')}
                >
                  {co(p)}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {afterHero}

      <section
        className={
          'mx-auto w-full px-4 pt-[44px] pb-[24px] sm:px-6 sm:pt-[56px] ' +
          (richBlocks ? 'max-w-[1080px]' : 'max-w-[860px]')
        }
      >
        {richBlocks ? (
          <>
            <div className="grid gap-[18px] sm:grid-cols-2">
              {blocks.map((block, i) => (
                <RichBlock key={i} block={block} co={co} index={i} />
              ))}
            </div>
            {page.faqs?.length && !blocks.some((b) => b.faqs?.length) ? (
              <div className="mt-[18px] rounded-[20px] border border-card-border bg-white p-[26px] sm:p-[34px]">
                <ContentFaq title="Frequently Asked Questions" items={page.faqs} />
              </div>
            ) : null}
            <div className="mt-[18px]">
              <NapBlock tenant={tenant} />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-[20px]">
            {blocks.map((block, i) => {
              const n = block.is_step ? ++stepNo : 0;
              return <Block key={i} block={block} stepNo={n} co={co} />;
            })}

            {page.faqs?.length && !blocks.some((b) => b.faqs?.length) ? (
              <div className="rounded-[20px] border border-card-border bg-white p-[26px] sm:p-[34px]">
                <ContentFaq title="Frequently Asked Questions" items={page.faqs} />
              </div>
            ) : null}

            <NapBlock tenant={tenant} />
          </div>
        )}

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
  if (block.faqs?.length) {
    return (
      <div className="rounded-[20px] border border-card-border bg-white p-[26px] sm:p-[34px]">
        <ContentFaq title={block.heading ? co(block.heading) : 'Frequently Asked Questions'} items={block.faqs} />
      </div>
    );
  }
  const paragraphs = block.paragraphs?.length ? (
    <div className="mt-[16px] flex max-w-[720px] flex-col gap-[13px]">
      {block.paragraphs.map((p, j) => (
        <p key={j} className="text-[16.5px] leading-[1.75] text-label">
          {co(p)}
        </p>
      ))}
    </div>
  ) : null;

  const linkRow = block.link?.href ? (
    <Link
      href={block.link.href}
      className="mt-[18px] inline-flex items-center gap-[7px] text-[14.5px] font-semibold text-primary hover:gap-[10px]"
    >
      {co(block.link.label || 'Learn more')}
      <ArrowRight size={16} />
    </Link>
  ) : null;

  if (block.is_step) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-card-border bg-subtle p-[28px] sm:p-[34px]">
        {stepNo ? (
          <span className="block font-manrope text-[40px] font-extrabold leading-none tracking-[-0.03em] text-primary/25">
            {String(stepNo).padStart(2, '0')}
          </span>
        ) : null}
        {block.heading ? (
          <h2 className="mt-[12px] font-manrope text-[22px] font-bold leading-[1.25] tracking-[-0.01em] text-ink sm:text-[25px]">
            {co(block.heading)}
          </h2>
        ) : null}
        {paragraphs}
        {linkRow}
      </div>
    );
  }

  return (
    <div className="border-t border-hairline pt-[30px] sm:pt-[36px]">
      {block.heading ? (
        <h2 className="font-manrope text-[23px] font-bold leading-[1.2] tracking-[-0.015em] text-ink sm:text-[27px]">
          {co(block.heading)}
        </h2>
      ) : null}

      {paragraphs}

      {block.bullets?.length ? (
        <ul className="mt-[20px] grid gap-x-[28px] gap-y-[13px] sm:grid-cols-2">
          {block.bullets.map((b, j) => (
            <li key={j} className="flex gap-[11px] text-[15.5px] leading-[1.55] text-label">
              <Check size={17} className="mt-[3px] flex-shrink-0 text-primary" />
              <span>{co(b)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {hasSteps ? (
        <ol className="mt-[8px] flex flex-col gap-[4px]">
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

      {linkRow}
    </div>
  );
}

function RichBlock({
  block,
  co,
  index,
}: {
  block: ContentBlock;
  co: (t: string) => string;
  index: number;
}) {
  if (block.faqs?.length) {
    return (
      <div className="rounded-[20px] border border-card-border bg-white p-[26px] sm:p-[30px]">
        <ContentFaq title={block.heading ? co(block.heading) : 'Frequently Asked Questions'} items={block.faqs} />
      </div>
    );
  }
  const Icon = RICH_ICONS[index % RICH_ICONS.length];
  return (
    <div className="flex flex-col rounded-[20px] border border-card-border bg-white p-[26px] sm:p-[30px]">
      <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon size={21} />
      </span>
      {block.heading ? (
        <h2 className="mt-[16px] font-manrope text-[20px] font-bold leading-[1.25] tracking-[-0.01em] text-ink">
          {co(block.heading)}
        </h2>
      ) : null}
      {block.paragraphs?.length ? (
        <div className="mt-[10px] flex flex-col gap-[10px]">
          {block.paragraphs.map((p, j) => (
            <p key={j} className="text-[15px] leading-[1.65] text-muted">
              {co(p)}
            </p>
          ))}
        </div>
      ) : null}
      {block.bullets?.length ? (
        <ul className="mt-[16px] flex flex-col gap-[11px]">
          {block.bullets.map((b, j) => {
            const text = co(b);
            const ci = text.indexOf(': ');
            const hasKey = ci > 0 && ci <= 22;
            return (
              <li key={j} className="flex gap-[11px] text-[14.5px] leading-[1.55]">
                <Check size={16} className="mt-[3px] flex-shrink-0 text-primary" />
                {hasKey ? (
                  <span>
                    <span className="font-semibold text-ink">{text.slice(0, ci)}</span>
                    <span className="text-muted">{text.slice(ci + 1)}</span>
                  </span>
                ) : (
                  <span className="text-label">{text}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      {block.link?.href ? (
        <Link
          href={block.link.href}
          className="mt-auto inline-flex items-center gap-[7px] pt-[18px] text-[14px] font-semibold text-primary hover:gap-[10px]"
        >
          {co(block.link.label || 'Learn more')}
          <ArrowRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}
