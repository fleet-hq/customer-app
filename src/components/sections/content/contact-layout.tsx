import type { Tenant } from '@/lib/tenant';
import { withCompany } from '@/lib/tenant';
import type { ContentPage } from '@/services/companyContentServices';
import { contentPageSchema } from '@/lib/schema';
import { JsonLd } from '@/components/seo/json-ld';
import { ContactActions } from './contact-actions';
import { MapPin } from '@/components/ui/icons';

export function ContactLayout({ tenant, page, path }: { tenant: Tenant; page: ContentPage; path: string }) {
  const co = (t: string) => withCompany(t, tenant.name);
  const blocks = page.blocks ?? [];

  return (
    <div className="bg-white text-ink">
      <JsonLd data={contentPageSchema(tenant, page, path)} />

      <section className="relative overflow-hidden border-b border-hairline bg-secondary">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(110% 120% at 90% -20%, color-mix(in srgb, var(--color-primary) 45%, transparent) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-[1080px] px-4 pt-[56px] pb-[48px] sm:px-6 sm:pt-[72px] sm:pb-[56px]">
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70">
            {co(page.eyebrow || 'Contact')}
          </span>
          {page.h1 ? (
            <h1 className="mt-[16px] max-w-[720px] font-manrope text-[34px] font-bold leading-[1.1] tracking-[-0.025em] text-white text-balance sm:text-[46px]">
              {co(page.h1)}
            </h1>
          ) : null}
          {page.intro?.length ? (
            <div className="mt-[16px] flex max-w-[620px] flex-col gap-[10px]">
              {page.intro.map((p, i) => (
                <p key={i} className="text-[16px] leading-[1.65] text-white/85">
                  {co(p)}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-4 pt-[36px] pb-[24px] sm:px-6 sm:pt-[44px]">
        <ContactActions tenant={tenant} />

        {blocks.map((block, i) => (
          <div
            key={i}
            className="mt-[24px] flex flex-col gap-[16px] rounded-[20px] border border-card-border bg-subtle p-[26px] sm:flex-row sm:items-start sm:gap-[24px] sm:p-[32px]"
          >
            <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <MapPin size={22} />
            </span>
            <div>
              {block.heading ? (
                <h2 className="m-0 font-manrope text-[21px] font-bold tracking-[-0.01em] text-ink">
                  {co(block.heading)}
                </h2>
              ) : null}
              {block.paragraphs?.length ? (
                <div className="mt-[10px] flex flex-col gap-[8px]">
                  {block.paragraphs.map((p, j) => (
                    <p key={j} className="text-[15.5px] leading-[1.7] text-label">
                      {co(p)}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
