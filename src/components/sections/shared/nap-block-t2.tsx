import type { Tenant } from '@/lib/tenant';
import { tenantWhatsapp } from '@/lib/seo';
import styles from '@/styles/template-2.module.css';

export function NapBlockT2({ tenant }: { tenant: Tenant }) {
  const seo = tenant.sections.seo;
  const { phone, email } = tenant.footer.contact;
  const serving = seo?.serving || tenant.footer.description || tenant.brand.description;
  const wa = tenantWhatsapp(tenant);

  return (
    <div className={styles.napBlock}>
      <strong>{seo?.og_site_name || tenant.name}</strong>
      {serving ? <p>{serving}</p> : null}
      <div className={styles.napContacts}>
        {phone ? <a href={wa || `tel:${phone}`}>{phone}</a> : null}
        {email ? <a href={`mailto:${email}`}>{email}</a> : null}
      </div>
    </div>
  );
}
