'use client';

import { Suspense } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { Download, Check } from '@/components/ui/icons';
import { ValidationModal } from '@/components/ui/validation-modal';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { RentalAgreementPreview } from '@/components/booking/rental-agreement-preview';
import { useTenant } from '@/lib/tenant-context';
import { useRentalAgreementIndex } from './use-rental-agreement-index';
import RentalAgreementIndexT2 from './rental-agreement-index-t2';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">{children}</section>
    </div>
  );
}

function RentalAgreementIndex() {
  const tenant = useTenant();

  if (tenant.websiteTemplate === 'template_2') {
    return <RentalAgreementIndexT2 />;
  }

  const {
    bookingId,
    agreement,
    isLoading,
    agree,
    setAgree,
    signature,
    setSignature,
    isSaving,
    error,
    validationModal,
    setValidationModal,
    handleAccept,
    isSigned,
  } = useRentalAgreementIndex();

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="text-sm text-faint">Loading agreement&hellip;</p>
        </div>
      </Shell>
    );
  }

  if (bookingId && !agreement) {
    return (
      <Shell>
        <BackLink href={paths.home}>Go Back</BackLink>
        <div className="mt-12 text-center">
          <h1 className="text-[22px] font-semibold text-secondary">Agreement not found</h1>
          <p className="mt-3 text-[14px] font-light text-faint">
            No agreement found for this booking. Please contact support.
          </p>
        </div>
      </Shell>
    );
  }

  if (!agreement) {
    return (
      <Shell>
        <BackLink href={paths.home}>Go Back</BackLink>
        <div className="mt-12 text-center">
          <h1 className="text-[22px] font-semibold text-secondary">Agreement not found</h1>
          <p className="mt-3 text-[14px] font-light text-faint">
            The agreement you are looking for does not exist.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <>
      <Shell>
        <BackLink href={bookingId ? paths.booking(bookingId) : paths.home}>Go Back</BackLink>

        <div className="mt-[14px] mb-7 flex items-start justify-between gap-6">
          <div className="max-w-[720px]">
            <h1 className="text-[26px] font-semibold text-secondary">{agreement.template.title}</h1>
            <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">
              {agreement.template.description}
            </p>
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
            <label
              onClick={() => setAgree((a) => !a)}
              className="flex max-w-[520px] cursor-pointer items-start gap-3"
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
                <span className="font-semibold text-ink">{agreement.template.title}</span> set out above,
                including the insurance, fuel, mileage and cancellation provisions.
              </span>
            </label>
            <button
              type="button"
              disabled={!signature || !agree || isSaving}
              onClick={handleAccept}
              className={cn(
                'ml-auto rounded-[9px] px-8 py-3 text-sm font-semibold text-white',
                signature && agree && !isSaving ? 'bg-primary' : 'cursor-not-allowed bg-primary-disabled',
              )}
            >
              {isSaving ? 'Saving…' : 'Sign & Accept'}
            </button>
          </div>
        )}
      </Shell>

      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal({ isOpen: false, title: '', message: '' })}
        title={validationModal.title}
        message={validationModal.message}
      />
    </>
  );
}

export default function RentalAgreementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RentalAgreementIndex />
    </Suspense>
  );
}
