import { tenantWhatsapp, telHref } from '@/lib/seo';
import type { Tenant } from '@/lib/tenant';

/** Name/address/phone block closing a content page — the same SEO
 *  signal the other templates emit, in template 3's frame. */
export function NapBlockT3({ tenant }: { tenant: Tenant }) {
  const seo = tenant.sections.seo;
  const { phone, email } = tenant.footer.contact;
  const serving = seo?.serving || tenant.footer.description || tenant.brand.description;
  const wa = tenantWhatsapp(tenant);

  return (
    <div className="nap">
      <strong>{seo?.og_site_name || tenant.name}</strong>
      {serving ? <p>{serving}</p> : null}
      <div className="nap-contacts">
        {phone ? <a href={wa || telHref(phone) || undefined}>{phone}</a> : null}
        {email ? <a href={`mailto:${email}`}>{email}</a> : null}
      </div>
    </div>
  );
}
