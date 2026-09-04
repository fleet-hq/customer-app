import { notFound } from 'next/navigation';

import { getCurrentTenant } from '@/lib/get-tenant';
import { withCompany } from '@/lib/tenant';
import { Sparkles, Clock, ShieldCheck, Phone, Mail } from '@/components/ui/icons';
import { InquiryForm } from '@/components/sections/inquiry/inquiry-form';

const TRUST_POINTS = [
  { icon: Clock, text: 'We reply fast — usually within the hour during opening times.' },
  { icon: ShieldCheck, text: 'An inquiry holds nothing and costs nothing. We confirm availability first.' },
];

export async function InquiryPageBody() {
  const tenant = await getCurrentTenant();
  const config = tenant.sections.inquiry_form;
  if (!config) notFound();

  const co = (t: string) => withCompany(t, tenant.name);
  const phone = tenant.footer.contact.phone;
  const email = tenant.footer.contact.email;

  return (
    <div className="bg-white text-ink">
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-[36px] px-4 pt-[44px] pb-[64px] sm:px-6 sm:pt-[56px] sm:pb-[80px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-[56px]">
        <aside className="flex flex-col gap-[24px] lg:pt-[8px]">
          <div className="flex flex-col gap-[16px]">
            <span className="inline-flex w-fit items-center rounded-full border border-primary-border bg-white px-[13px] py-[6px] text-[11.5px] font-semibold uppercase tracking-[0.06em] text-primary">
              {tenant.name}
            </span>
            <h1 className="font-manrope text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-ink text-balance sm:text-[38px]">
              {co(config.title || 'Book your car')}
            </h1>
            {config.intro?.length ? (
              <div className="flex flex-col gap-[10px]">
                {config.intro.map((p, i) => (
                  <p key={i} className="text-[15.5px] leading-[1.7] text-muted">
                    {co(p)}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {config.promo_note ? (
            <div className="flex items-start gap-[12px] rounded-[14px] border border-primary-border bg-primary-soft p-[18px]">
              <span className="mt-[1px] flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Sparkles size={16} />
              </span>
              <p className="text-[14.5px] font-semibold leading-[1.5] text-primary">
                {co(config.promo_note)}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-[14px] border-t border-hairline pt-[22px]">
            {TRUST_POINTS.map((p, i) => (
              <div key={i} className="flex items-start gap-[11px]">
                <span className="mt-[1px] flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-chip text-glyph">
                  <p.icon size={14} />
                </span>
                <p className="text-[14px] leading-[1.55] text-muted">{p.text}</p>
              </div>
            ))}
            {(phone || email) ? (
              <div className="mt-[4px] flex flex-wrap gap-x-[20px] gap-y-[8px] pt-[6px]">
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-[7px] text-[14px] font-semibold text-ink no-underline hover:text-primary"
                  >
                    <Phone size={15} className="text-primary" /> {phone}
                  </a>
                ) : null}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-[7px] text-[14px] font-semibold text-ink no-underline hover:text-primary"
                  >
                    <Mail size={15} className="text-primary" /> {email}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="rounded-[22px] border border-card-border bg-white p-[22px] shadow-[var(--shadow-card)] sm:p-[32px]">
          <InquiryForm config={config} tenantName={tenant.name} domain={tenant.domain} />
        </div>
      </div>
    </div>
  );
}
