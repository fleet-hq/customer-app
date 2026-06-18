'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { Download, Check } from '@/components/ui/icons';
import { useTenant } from '@/lib/tenant-context';
import { getSiteContent, withCompany } from '@/lib/site-content';
import { setAgreementSigned } from '@/lib/booking-state';
import { cn } from '@/lib/utils';
import { SAMPLE_BOOKING, DEMO_USER } from '@/lib/mock-data';
import { paths } from '@/lib/paths';

export default function TermsPage() {
  const router = useRouter();
  const tenant = useTenant();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [agree, setAgree] = useState(false);
  const [sigEmpty, setSigEmpty] = useState(true);
  const [today, setToday] = useState('');

  useEffect(() => {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date();
    setToday(`${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`);
  }, []);

  const clearSig = () => {
    sigRef.current?.clear();
    setSigEmpty(true);
  };

  const ready = agree && !sigEmpty;

  const accept = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!ready) return;
    setAgreementSigned();
    router.push(paths.booking(SAMPLE_BOOKING.id));
  };

  const content = getSiteContent(tenant.slug);
  const sections = content.terms.sections.map((sec) => ({
    heading: sec.heading,
    paras: sec.paras.map((p) => withCompany(p, tenant.name)),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
        <BackLink href={paths.booking(SAMPLE_BOOKING.id)}>Go Back</BackLink>

        <div className="mt-[14px] flex items-start justify-between gap-6">
          <div className="max-w-[720px]">
            <h1 className="text-[26px] font-semibold text-secondary">Terms and Conditions</h1>
            <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">{content.terms.intro}</p>
          </div>
          <button className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white">
            <Download size={15} /> Download PDF
          </button>
        </div>

        <div className="my-7 h-px bg-hairline" />

        <div className="flex flex-col gap-9">
          {sections.map((sec) => (
            <div key={sec.heading}>
              <h2 className="mb-[14px] text-[17px] font-semibold text-primary">{sec.heading}</h2>
              <div className="flex flex-col gap-[14px]">
                {sec.paras.map((text, i) => (
                  <p key={i} className="text-[15px] font-light leading-[1.75] text-label">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-11 rounded-2xl border border-card-border bg-subtle-2 p-[26px]">
          <h2 className="text-[17px] font-semibold text-secondary">{content.terms.signTitle}</h2>
          <p className="mt-2 mb-[22px] text-[13px] font-light leading-[1.55] text-faint">{content.terms.signIntro}</p>

          <label
            onClick={() => setAgree((a) => !a)}
            className="mb-[22px] flex cursor-pointer items-start gap-3"
          >
            <span
              className={cn(
                'mt-px inline-flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                agree ? 'border-primary bg-primary' : 'border-control bg-white',
              )}
            >
              {agree && <Check size={12} strokeWidth={3} className="text-white" />}
            </span>
            <span className="text-[13px] leading-[1.6] text-label">
              I have read and agree to the{' '}
              <span className="font-semibold text-ink">Terms and Conditions</span> set out above, including the
              insurance, fuel, mileage and cancellation provisions.
            </span>
          </label>

          <div className="mb-[10px] flex max-w-[460px] items-center justify-between">
            <span className="text-xs font-semibold text-ink">Signature</span>
            <button onClick={clearSig} className="text-xs font-semibold text-primary">
              Clear
            </button>
          </div>

          <div className="relative max-w-[460px] overflow-hidden rounded-xl border-[1.5px] border-dashed border-dash bg-white">
            <SignatureCanvas
              ref={sigRef}
              penColor={tenant.theme.secondary}
              onEnd={() => setSigEmpty(false)}
              canvasProps={{ className: 'block w-full', height: 150, style: { width: '100%', height: 150, touchAction: 'none', cursor: 'crosshair' } }}
            />
            {sigEmpty && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] text-control">&#9997;&#65038; Sign here</span>
              </div>
            )}
            <div className="pointer-events-none absolute bottom-[30px] left-6 right-6 h-px bg-line" />
          </div>

          <div className="mt-2 text-[11.5px] text-faint">
            Signed by <span className="font-semibold text-ink">{DEMO_USER.name}</span> &middot; {today}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-[14px]">
          <span className={cn('max-w-[320px] text-xs', ready ? 'text-success' : 'text-faint')}>
            {ready ? "Signed — you're ready to accept." : 'Tick the box and sign above to accept.'}
          </span>
          <div className="ml-auto flex gap-[14px]">
            <Link
              href={paths.booking(SAMPLE_BOOKING.id)}
              className="rounded-[9px] bg-ink px-8 py-3 text-sm font-semibold text-white no-underline"
            >
              Cancel
            </Link>
            <a
              href={paths.booking(SAMPLE_BOOKING.id)}
              onClick={accept}
              className={cn(
                'rounded-[9px] px-8 py-3 text-sm font-semibold text-white no-underline',
                ready ? 'bg-primary' : 'cursor-not-allowed bg-primary-disabled',
              )}
            >
              Sign &amp; Accept
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
