'use client';

import { Suspense } from 'react';
import DOMPurify from 'dompurify';
import { BackLink } from '@/components/ui/back-link';
import { Download, Check } from '@/components/ui/icons';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { RentalAgreementPreview } from '@/components/booking/rental-agreement-preview';
import { useTermsAgreement, type Section } from './use-terms-agreement';
import TermsClientT2 from './terms-client-t2';

function TermsSkeleton() {
  return (
    <div className="flex flex-col gap-9" aria-busy="true" aria-label="Loading terms">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-[14px]">
          <div className="h-[18px] w-[220px] rounded-md bg-subtle animate-pulse" />
          <div className="h-[14px] w-full rounded bg-subtle animate-pulse" />
          <div className="h-[14px] w-[92%] rounded bg-subtle animate-pulse" />
          <div className="h-[14px] w-[85%] rounded bg-subtle animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function SectionBlock({ sec }: { sec: Section }) {
  return (
    <div>
      <h2 className="mb-[14px] text-[17px] font-semibold text-primary">{sec.heading}</h2>
      {sec.html !== undefined ? (
        <div
          className="flex flex-col gap-[14px] text-[15px] font-light leading-[1.75] text-label [&_li]:ml-5 [&_li]:list-disc"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sec.html) }}
        />
      ) : (
        <div className="flex flex-col gap-[14px]">
          {sec.paras?.map((text, i) => (
            <p key={i} className="whitespace-pre-line text-[15px] font-light leading-[1.75] text-label">
              {text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function TermsContent() {
  const tenant = useTenant();

  if (tenant.websiteTemplate === 'template_2') {
    return <TermsClientT2 />;
  }

  const {
    isBound,
    tokenReady,
    bookingLoading,
    bookingError,
    agreement,
    agree,
    setAgree,
    signature,
    setSignature,
    saving,
    error,
    accept,
    backHref,
    isSigned,
    title,
    intro,
    sections,
    templateLoading,
  } = useTermsAgreement();

  if (isBound) {
    if (!tokenReady || bookingLoading) {
      return (
        <div className="flex min-h-screen flex-col bg-white text-ink">
          <section className="mx-auto flex w-full max-w-[1000px] flex-1 items-center justify-center px-6 py-24">
            <p className="text-sm text-faint">Loading agreement&hellip;</p>
          </section>
        </div>
      );
    }

    if (bookingError || !agreement) {
      return (
        <div className="flex min-h-screen flex-col bg-white text-ink">
          <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
            <BackLink href={backHref}>Go Back</BackLink>
            <div className="mt-12 text-center">
              <h1 className="text-[22px] font-semibold text-secondary">Agreement not found</h1>
              <p className="mt-3 text-[14px] font-light text-faint">
                We couldn&apos;t load this booking. Please re-open the agreement from the link we emailed you.
              </p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
          <BackLink href={backHref}>Go Back</BackLink>

          <div className="mt-[14px] mb-7 flex items-start justify-between gap-6">
            <div className="max-w-[720px]">
              <h1 className="text-[26px] font-semibold text-secondary">{agreement.template.title}</h1>
              <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">{agreement.template.description}</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white"
            >
              <Download size={15} /> Download PDF
            </button>
          </div>

          <RentalAgreementPreview data={agreement} onSignatureChange={setSignature} />

          {error && <p className="mx-auto mt-4 max-w-[820px] text-xs text-danger">{error}</p>}

          {isSigned ? (
            <div className="mx-auto mt-6 flex max-w-[820px] items-center gap-2 rounded-[10px] border border-green-border-2 bg-green-bg px-4 py-3 text-[13px] font-medium text-success">
              <Check size={16} strokeWidth={3} /> This agreement has been signed.
            </div>
          ) : (
            <div className="no-print mx-auto mt-6 flex max-w-[820px] flex-wrap items-center justify-between gap-[14px]">
              <label onClick={() => setAgree((a) => !a)} className="flex max-w-[520px] cursor-pointer items-start gap-3">
                <span
                  className={cn(
                    'mt-px inline-flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                    agree ? 'border-primary bg-primary' : 'border-control bg-white',
                  )}
                >
                  {agree && <Check size={12} strokeWidth={3} className="text-white" />}
                </span>
                <span className="text-[13px] leading-[1.6] text-label">
                  I have read and agree to the <span className="font-semibold text-ink">{agreement.template.title}</span>{' '}
                  set out above, including the insurance, fuel, mileage and cancellation provisions.
                </span>
              </label>
              <button
                type="button"
                disabled={!signature || !agree || saving}
                onClick={accept}
                className={cn(
                  'ml-auto rounded-[9px] px-8 py-3 text-sm font-semibold text-white',
                  signature && agree && !saving ? 'bg-primary' : 'cursor-not-allowed bg-primary-disabled',
                )}
              >
                {saving ? 'Saving…' : 'Sign & Accept'}
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
        <BackLink href={paths.home}>Go Back</BackLink>

        <div className="mt-[14px] flex items-start justify-between gap-6">
          <div className="max-w-[720px]">
            <h1 className="text-[26px] font-semibold text-secondary">{title}</h1>
            <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">{intro}</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>

        <div className="my-7 h-px bg-hairline" />

        {templateLoading ? (
          <TermsSkeleton />
        ) : (
          <div className="flex flex-col gap-9">
            {sections.map((sec) => (
              <SectionBlock key={sec.heading} sec={sec} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <TermsContent />
    </Suspense>
  );
}
