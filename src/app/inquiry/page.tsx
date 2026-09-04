import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { InquiryForm } from '@/components/sections/inquiry/inquiry-form';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getCurrentTenant();
    return {
      title: `${tenant.sections.inquiry_form?.title || 'Book a Car'} — ${tenant.name}`,
    };
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Inquiry' };
    throw err;
  }
}

export default async function InquiryPage() {
  const tenant = await getCurrentTenant();
  const config = tenant.sections.inquiry_form;
  if (!config) notFound();

  const co = (t: string) => withCompany(t, tenant.name);

  return (
    <div className="bg-white text-ink">
      <section className="mx-auto w-full max-w-[720px] px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
        <header className="mb-8 flex flex-col gap-3">
          <h1 className="text-[28px] font-extrabold leading-[1.15] text-ink text-balance sm:text-[34px]">
            {co(config.title || 'Customer Inquiry Form')}
          </h1>
          {config.intro?.length ? (
            <div className="flex flex-col gap-2">
              {config.intro.map((p, i) => (
                <p key={i} className="text-[15.5px] leading-[1.7] text-muted">
                  {co(p)}
                </p>
              ))}
            </div>
          ) : null}
          {config.promo_note ? (
            <p className="mt-1 inline-flex w-fit rounded-full bg-primary-soft px-4 py-1.5 text-[13.5px] font-semibold text-primary">
              {co(config.promo_note)}
            </p>
          ) : null}
        </header>

        <InquiryForm config={config} tenantName={tenant.name} domain={tenant.domain} />
      </section>
    </div>
  );
}
