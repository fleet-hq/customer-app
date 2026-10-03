import { withCompany } from '@/lib/tenant';
import type { Tenant } from '@/lib/tenant';
import type { InquiryFormConfig } from '@/services/companyContentServices';
import { Sparkles, Clock, ShieldCheck, Phone, Mail } from '@/components/ui/icons';
import { InquiryForm } from '@/components/sections/inquiry/inquiry-form';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

const TRUST_POINTS = [
  { icon: Clock, text: 'We reply fast — usually within the hour during opening times.' },
  { icon: ShieldCheck, text: 'An inquiry holds nothing and costs nothing. We confirm availability first.' },
];

/** Template-2 sibling of InquiryPageBody. Reads the exact same
 *  `tenant.sections.inquiry_form` data and renders the same shared
 *  `InquiryForm` — only the surrounding card/aside layout differs. */
export function InquiryPageBodyT2({ tenant, config }: { tenant: Tenant; config: InquiryFormConfig }) {
  const co = (t: string) => withCompany(t, tenant.name);
  const phone = tenant.footer.contact.phone;
  const email = tenant.footer.contact.email;

  return (
    <div className={styles.container}>
      <div className={styles.formLayout}>
        <aside className={styles.formAside}>
          <div>
            <p className={styles.eyebrow}>
              <Dyn>{tenant.name}</Dyn>
            </p>
            <h1>
              <Dyn>{co(config.title || 'Book your car')}</Dyn>
            </h1>
          </div>

          {config.intro?.length ? (
            <div className={styles.formIntro}>
              {config.intro.map((p, i) => (
                <p key={i}>
                  <Dyn>{co(p)}</Dyn>
                </p>
              ))}
            </div>
          ) : null}

          {config.promo_note ? (
            <div className={styles.formNote}>
              <Sparkles size={16} />
              <span>
                <Dyn>{co(config.promo_note)}</Dyn>
              </span>
            </div>
          ) : null}

          <div className={styles.formTrust}>
            {TRUST_POINTS.map((p, i) => (
              <div key={i} className={styles.formTrustItem}>
                <p.icon size={14} />
                <p>
                  <Dyn>{p.text}</Dyn>
                </p>
              </div>
            ))}
            {phone || email ? (
              <div className={styles.formContacts}>
                {phone ? (
                  <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`}>
                    <Phone size={14} /> {phone}
                  </a>
                ) : null}
                {email ? (
                  <a href={`mailto:${email}`}>
                    <Mail size={14} /> {email}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>

        <div className={styles.formCard}>
          <InquiryForm config={config} tenantName={tenant.name} domain={tenant.domain} />
        </div>
      </div>
    </div>
  );
}
