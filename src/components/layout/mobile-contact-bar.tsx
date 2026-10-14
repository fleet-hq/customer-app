'use client';

import { useTenant } from '@/lib/tenant-context';
import { telHref, smsHref } from '@/lib/seo';

export function MobileContactBar() {
  const tenant = useTenant();
  const phone = tenant.footer.contact.phone;
  const tel = telHref(phone);
  const sms = smsHref(phone);
  if (!tel && !sms) return null;

  const accent = tenant.brand.theme.primary || 'var(--brass, #111)';

  return (
    <>
      <div aria-hidden="true" className="h-[68px] sm:hidden" />
      <nav
        aria-label="Call or text"
        className="fixed inset-x-0 bottom-0 z-50 flex gap-[10px] border-t border-black/10 bg-white px-[14px] py-[11px] shadow-[0_-4px_18px_rgba(0,0,0,0.1)] sm:hidden"
        style={{ paddingBottom: 'calc(11px + env(safe-area-inset-bottom))' }}
      >
        {tel ? (
          <a
            href={tel}
            data-contact-action="call"
            className="flex flex-1 items-center justify-center rounded-full px-[18px] py-[12px] text-[15px] font-semibold"
            style={{ background: accent, color: 'var(--on-brass, #fff)' }}
          >
            Call
          </a>
        ) : null}
        {sms ? (
          <a
            href={sms}
            data-contact-action="text"
            className="flex flex-1 items-center justify-center rounded-full border px-[18px] py-[12px] text-[15px] font-semibold text-ink"
            style={{ borderColor: accent }}
          >
            Text
          </a>
        ) : null}
      </nav>
    </>
  );
}
