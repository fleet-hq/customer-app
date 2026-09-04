import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { paths } from '@/lib/paths';
import { notFound } from 'next/navigation';
import { BrandCta } from '@/components/sections/shared/brand-cta';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getCurrentTenant();
    const s = tenant.sections.services;
    if (!s) return { title: `Services — ${tenant.name}` };
    const co = (t: string) => withCompany(t, tenant.name);
    return {
      title: s.meta_title ? co(s.meta_title) : `Services — ${tenant.name}`,
      description: s.meta_description ? co(s.meta_description) : undefined,
    };
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Services' };
    throw err;
  }
}

export default async function ServicesPage() {
  const tenant = await getCurrentTenant();
  const s = tenant.sections.services;
  const hasContent = !!(s && (s.h1 || s.intro?.length || s.blocks?.length));
  if (!hasContent) notFound();

  const co = (t: string) => withCompany(t, tenant.name);
  const cta = s!.cta;
  const blocks = s!.blocks ?? [];

  return (
    <div className="bg-white text-ink">
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
          <span className="inline-flex items-center rounded-full border border-primary-border bg-white px-[13px] py-[6px] text-[11.5px] font-semibold uppercase tracking-[0.06em] text-primary">
            {tenant.name}
          </span>
          {s!.h1 ? (
            <h1 className="mt-[18px] font-manrope text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-ink text-balance sm:text-[46px]">
              {co(s!.h1)}
            </h1>
          ) : null}
          {s!.intro?.length ? (
            <div className="mt-[16px] flex max-w-[640px] flex-col gap-[12px]">
              {s!.intro.map((p, i) => (
                <p key={i} className="text-[16.5px] leading-[1.7] text-muted">
                  {co(p)}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[860px] px-4 pt-[44px] pb-[24px] sm:px-6 sm:pt-[56px]">
        <div className="flex flex-col gap-[20px]">
          {blocks.map((block, i) => {
            const hasSteps = !!block.steps?.length;
            return (
              <div
                key={i}
                className={
                  'rounded-[20px] border border-card-border p-[26px] sm:p-[34px] ' +
                  (hasSteps ? 'bg-subtle' : 'bg-white')
                }
              >
                {block.heading ? (
                  <div className="mb-[18px] flex items-center gap-[12px]">
                    <span className="h-[22px] w-[4px] flex-shrink-0 rounded-full bg-primary" />
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
                        <p className="pt-[5px] pb-[16px] text-[16px] leading-[1.65] text-label">
                          {co(step)}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {block.bullets?.length ? (
                  <div className="mt-[16px] flex flex-wrap gap-[10px] pl-[16px]">
                    {block.bullets.map((b, j) => (
                      <span
                        key={j}
                        className="rounded-full border border-card-border bg-white px-[16px] py-[8px] text-[14px] font-medium text-label"
                      >
                        {co(b)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {cta && (cta.title || cta.description || cta.cta_label) ? (
          <div className="mt-[40px]">
            <BrandCta
              title={co(cta.title || 'Ready to book?')}
              description={cta.description ? co(cta.description) : undefined}
              ctaLabel={co(cta.cta_label || 'See available cars')}
              ctaHref={cta.cta_href || paths.fleet}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
