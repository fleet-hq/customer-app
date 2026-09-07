import type { Tenant } from '@/lib/tenant';
import { tenantWhatsapp } from '@/lib/seo';
import { Phone, Mail } from '@/components/ui/icons';

export function NapBlock({ tenant }: { tenant: Tenant }) {
  const seo = tenant.sections.seo;
  const { phone, email } = tenant.footer.contact;
  const serving = seo?.serving || tenant.footer.description || tenant.brand.description;
  const wa = tenantWhatsapp(tenant);

  return (
    <div className="rounded-[20px] border border-card-border bg-subtle p-[26px] sm:p-[30px]">
      <p className="m-0 font-manrope text-[17px] font-bold text-ink">
        {seo?.og_site_name || tenant.name}
      </p>
      {serving ? <p className="mt-[6px] text-[14.5px] leading-[1.6] text-muted">{serving}</p> : null}
      <div className="mt-[16px] flex flex-col gap-[10px] text-[14.5px] text-label">
        {phone ? (
          <a href={wa || `tel:${phone}`} className="inline-flex items-center gap-[10px] hover:text-primary">
            <Phone size={16} />
            <span>{phone}</span>
          </a>
        ) : null}
        {email ? (
          <a href={`mailto:${email}`} className="inline-flex items-center gap-[10px] hover:text-primary">
            <Mail size={16} />
            <span>{email}</span>
          </a>
        ) : null}
      </div>
      {seo?.delivery_note ? (
        <p className="mt-[16px] text-[13.5px] leading-[1.6] text-muted">{seo.delivery_note}</p>
      ) : null}
    </div>
  );
}
