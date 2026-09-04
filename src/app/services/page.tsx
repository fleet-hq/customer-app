import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { paths } from '@/lib/paths';

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

  return (
    <div className="bg-white text-ink">
      <section className="mx-auto w-full max-w-[820px] px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
        <header className="flex flex-col gap-4">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-primary">
            {tenant.name}
          </span>
          {s!.h1 ? (
            <h1 className="text-[30px] font-extrabold leading-[1.15] text-ink text-balance sm:text-[40px]">
              {co(s!.h1)}
            </h1>
          ) : null}
          {s!.intro?.length ? (
            <div className="flex flex-col gap-3">
              {s!.intro.map((p, i) => (
                <p key={i} className="text-[16px] leading-[1.75] text-muted">
                  {co(p)}
                </p>
              ))}
            </div>
          ) : null}
        </header>

        <div className="mt-10 flex flex-col gap-10">
          {(s!.blocks ?? []).map((block, i) => (
            <div key={i} className="flex flex-col gap-4">
              {block.heading ? (
                <h2 className="text-[22px] font-bold leading-[1.3] text-ink text-balance">
                  {co(block.heading)}
                </h2>
              ) : null}
              {block.paragraphs?.length ? (
                <div className="flex flex-col gap-3">
                  {block.paragraphs.map((p, j) => (
                    <p key={j} className="text-[16px] leading-[1.75] text-ink-2">
                      {co(p)}
                    </p>
                  ))}
                </div>
              ) : null}
              {block.steps?.length ? (
                <ol className="flex flex-col gap-3">
                  {block.steps.map((step, j) => (
                    <li key={j} className="flex gap-3 text-[16px] leading-[1.7] text-ink-2">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
                        {j + 1}
                      </span>
                      <span className="pt-[2px]">{co(step)}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {block.bullets?.length ? (
                <ul className="flex flex-col gap-2 pl-1">
                  {block.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2 text-[16px] leading-[1.7] text-ink-2">
                      <span className="mt-[10px] h-[6px] w-[6px] flex-shrink-0 rounded-full bg-primary" />
                      <span>{co(b)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        {cta && (cta.title || cta.description || cta.cta_label) ? (
          <div className="mt-14 flex flex-col items-start gap-4 rounded-[16px] border border-card-border bg-subtle p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              {cta.title ? <p className="text-[18px] font-bold text-ink">{co(cta.title)}</p> : null}
              {cta.description ? (
                <p className="text-[14px] leading-[1.6] text-muted">{co(cta.description)}</p>
              ) : null}
            </div>
            {cta.cta_label ? (
              <Link
                href={cta.cta_href || paths.fleet}
                className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white no-underline transition-colors hover:bg-primary-hover"
              >
                {co(cta.cta_label)}
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
