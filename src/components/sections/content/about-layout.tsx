import type { Tenant } from '@/lib/tenant';
import { withCompany } from '@/lib/tenant';
import type { ContentPage } from '@/services/companyContentServices';
import { contentPageSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/json-ld';
import { ContactActions } from './contact-actions';
import { Car, Key, ShieldCheck, Headset } from '@/components/ui/icons';

const VALUE_ICONS = [Car, Key, ShieldCheck, Headset];

export function AboutLayout({ tenant, page, path }: { tenant: Tenant; page: ContentPage; path: string }) {
  const co = (t: string) => withCompany(t, tenant.name);
  const blocks = page.blocks ?? [];

  return (
    <div className="bg-white text-ink">
      <JsonLd data={contentPageSchema(tenant, page, path)} />

      <section className="border-b border-hairline bg-subtle">
        <div className="mx-auto w-full max-w-[1080px] px-4 pt-[56px] pb-[52px] sm:px-6 sm:pt-[76px] sm:pb-[64px]">
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-primary">
            {co(page.eyebrow || 'About')}
          </span>
          <div className="mt-[18px] grid gap-[22px] lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-[48px]">
            {page.h1 ? (
              <h1 className="m-0 font-manrope text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-ink text-balance sm:text-[50px]">
                {co(page.h1)}
              </h1>
            ) : null}
            {page.intro?.length ? (
              <div className="flex flex-col gap-[12px] lg:pt-[8px]">
                {page.intro.map((p, i) => (
                  <p key={i} className="text-[16px] leading-[1.7] text-muted">
                    {co(p)}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-4 py-[56px] sm:px-6 sm:py-[72px]">
        <div className="flex flex-col gap-[52px]">
          {blocks.map((block, i) => {
            const isValues = !!block.bullets?.length;
            return (
              <div key={i} className="grid gap-[18px] lg:grid-cols-[260px_1fr] lg:gap-[52px]">
                <div>
                  <span className="inline-block h-[3px] w-[38px] rounded-full bg-primary" />
                  <h2 className="mt-[14px] font-manrope text-[24px] font-bold leading-[1.2] tracking-[-0.01em] text-ink">
                    {block.heading ? co(block.heading) : ''}
                  </h2>
                </div>
                <div>
                  {block.paragraphs?.length ? (
                    <div className="flex max-w-[640px] flex-col gap-[14px]">
                      {block.paragraphs.map((p, j) => (
                        <p key={j} className="text-[16.5px] leading-[1.75] text-label">
                          {co(p)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {isValues ? (
                    <div className="grid gap-[16px] sm:grid-cols-2">
                      {block.bullets!.map((b, j) => {
                        const [title, ...rest] = co(b).split(' — ');
                        const desc = rest.join(' — ');
                        const Icon = VALUE_ICONS[j % VALUE_ICONS.length];
                        return (
                          <div
                            key={j}
                            className="rounded-[16px] border border-card-border bg-subtle p-[22px]"
                          >
                            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-primary-soft text-primary">
                              <Icon size={19} />
                            </span>
                            <p className="mt-[14px] font-manrope text-[16px] font-bold text-ink">{title}</p>
                            {desc ? (
                              <p className="mt-[5px] text-[14.5px] leading-[1.6] text-muted">{desc}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-hairline bg-subtle">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-[52px] sm:px-6 sm:py-[64px]">
          <div className="mb-[24px] max-w-[560px]">
            <h2 className="m-0 font-manrope text-[26px] font-bold tracking-[-0.02em] text-ink">Get in touch</h2>
            <p className="mt-[8px] text-[15.5px] leading-[1.6] text-muted">
              {tenant.sections.seo?.serving || `Serving ${tenant.sections.seo?.geo_placename || ''}.`} You reach one of us
              directly, every time.
            </p>
          </div>
          <ContactActions tenant={tenant} />
        </div>
      </section>
    </div>
  );
}
