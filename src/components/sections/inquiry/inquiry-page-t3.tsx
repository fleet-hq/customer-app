import { Dyn } from '@/components/i18n/Dyn';
import { InquiryForm } from '@/components/sections/inquiry/inquiry-form';
import { telHref } from '@/lib/seo';
import { withCompany } from '@/lib/tenant';
import type { Tenant } from '@/lib/tenant';
import type { InquiryFormConfig } from '@/services/companyContentServices';

/** Template-3 sibling of InquiryPageBody — the "Apply now" destination.
 *
 *  Renders the same shared `InquiryForm` templates 1 and 2 render, from
 *  the same `tenant.sections.inquiry_form` config, so a tenant's field
 *  overrides and options work identically whichever template they are
 *  on. Only the surround is template 3's: charcoal panel of copy on the
 *  left, the form boxed on the right, in the same editorial frame the
 *  rest of the template uses. */
export function InquiryPageBodyT3({
  tenant,
  config,
}: {
  tenant: Tenant;
  config: InquiryFormConfig;
}) {
  const co = (text: string) => withCompany(text, tenant.name);
  const phone = tenant.footer.contact.phone;
  const email = tenant.footer.contact.email;
  const tel = telHref(phone);

  return (
    <main className="pg">
      <div className="wrap rule">
        <i className="x tl" />
        <i className="x tr" />
        <div className="apply-grid">
          <aside className="apply-aside">
            <div className="eyebrow">
              <Dyn>{tenant.name}</Dyn>
            </div>
            <h1>
              <Dyn>{co(config.title || 'Apply to rent')}</Dyn>
            </h1>

            {config.intro?.length ? (
              <div className="apply-intro">
                {config.intro.map((paragraph, i) => (
                  <p key={i}>
                    <Dyn>{co(paragraph)}</Dyn>
                  </p>
                ))}
              </div>
            ) : null}

            {tel || email ? (
              <div className="apply-contacts">
                {tel ? <a href={tel}>{phone}</a> : null}
                {email ? <a href={`mailto:${email}`}>{email}</a> : null}
              </div>
            ) : null}
          </aside>

          <div className="apply-card">
            <InquiryForm config={config} tenantName={tenant.name} domain={tenant.domain} />
          </div>
        </div>
      </div>
    </main>
  );
}
