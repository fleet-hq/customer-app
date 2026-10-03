'use client';
import { BackLink } from '@/components/ui/back-link';
import { withCompany } from '@/lib/tenant';
import { useTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';
import PrivacyClientT2 from './privacy-client-t2';
import { PRIVACY_SECTIONS, PRIVACY_INTRO } from './privacy-content';

export default function PrivacyPage() {
  const tenant = useTenant();

  if (tenant.websiteTemplate === 'template_2') {
    return <PrivacyClientT2 />;
  }

  const title = 'Privacy Policy';
  const intro = withCompany(PRIVACY_INTRO, tenant.name);
  const sections = PRIVACY_SECTIONS.map((sec) => ({
    heading: sec.heading,
    paras: sec.paras.map((p) => withCompany(p, tenant.name)),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
        <BackLink href={paths.home}>Go Back</BackLink>

        <div className="mt-[14px] max-w-[720px]">
          <h1 className="text-[26px] font-semibold text-secondary">{title}</h1>
          <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">{intro}</p>
        </div>

        <div className="my-7 h-px bg-hairline" />

        <div className="flex flex-col gap-9">
          {sections.map((sec) => (
            <div key={sec.heading}>
              <h2 className="mb-[14px] text-[17px] font-semibold text-primary">{sec.heading}</h2>
              <div className="flex flex-col gap-[14px]">
                {sec.paras.map((text, i) => (
                  <p key={i} className="whitespace-pre-line text-[15px] font-light leading-[1.75] text-label">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
