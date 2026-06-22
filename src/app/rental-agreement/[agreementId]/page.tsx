'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackLink } from '@/components/ui/back-link';
import { Download, Check } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { useAgreement, useAcceptAgreement } from '@/hooks/useAgreements';
import { RentalAgreementPreview } from '@/components/booking/rental-agreement-preview';
import type { AgreementData } from '@/services/agreementServices';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">{children}</section>
    </div>
  );
}

export default function RentalAgreementPage({ params }: { params: Promise<{ agreementId: string }> }) {
  const { agreementId } = use(params);
  const router = useRouter();

  const isTemp = agreementId.startsWith('temp-agreement-');

  const [localData, setLocalData] = useState<AgreementData | null>(null);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isTemp) return;
    const stored = localStorage.getItem('pendingAgreement');
    if (stored) {
      try {
        setLocalData(JSON.parse(stored) as AgreementData);
      } catch {
        setLocalError('The stored agreement data is corrupted. Please create a new booking.');
      }
    }
    setLocalLoaded(true);
  }, [isTemp]);

  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState('');

  const {
    data: apiAgreement,
    isLoading: apiLoading,
    isError: apiError,
  } = useAgreement(isTemp ? undefined : agreementId);
  const { mutate: accept, isPending: accepting } = useAcceptAgreement();

  const agreement = isTemp ? localData : apiAgreement;
  const isLoading = isTemp ? !localLoaded : apiLoading;
  const isError = isTemp ? (localLoaded && !localData) || !!localError : apiError;

  const handleAccept = () => {
    if (!signature || !agree || accepting) return;
    setError('');

    if (isTemp && localData) {
      const signed = {
        ...localData,
        status: 'signed',
        signatureImage: signature,
        signedAt: new Date().toISOString(),
      };
      localStorage.setItem('pendingAgreement', JSON.stringify(signed));
      router.back();
      return;
    }

    accept(
      { agreementId, signatureData: signature },
      {
        onSuccess: () => router.back(),
        onError: () => setError('Failed to sign agreement. Please try again.'),
      },
    );
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="text-sm text-faint">Loading agreement&hellip;</p>
        </div>
      </Shell>
    );
  }

  if (isError || !agreement) {
    return (
      <Shell>
        <BackLink href={paths.home}>Go Back</BackLink>
        <div className="mt-12 text-center">
          <h1 className="text-[22px] font-semibold text-secondary">Agreement not found</h1>
          <p className="mt-3 text-[14px] font-light text-faint">
            {localError || 'The agreement you are looking for does not exist.'}
          </p>
        </div>
      </Shell>
    );
  }

  const isSigned = agreement.status === 'signed' || !!agreement.signatureImage;

  return (
    <Shell>
      <BackLink href={paths.home}>Go Back</BackLink>

      <div className="mt-[14px] mb-7 flex items-start justify-between gap-6">
        <div className="max-w-[720px]">
          <h1 className="text-[26px] font-semibold text-secondary">{agreement.template.title}</h1>
          <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">{agreement.template.description}</p>
        </div>
        <button className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white">
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
        <div className="mx-auto mt-6 flex max-w-[820px] flex-wrap items-center justify-between gap-[14px]">
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
              I have read and agree to the <span className="font-semibold text-ink">{agreement.template.title}</span> set
              out above, including the insurance, fuel, mileage and cancellation provisions.
            </span>
          </label>
          <button
            type="button"
            disabled={!signature || !agree || accepting}
            onClick={handleAccept}
            className={cn(
              'ml-auto rounded-[9px] px-8 py-3 text-sm font-semibold text-white',
              signature && agree && !accepting ? 'bg-primary' : 'cursor-not-allowed bg-primary-disabled',
            )}
          >
            {accepting ? 'Saving…' : 'Sign & Accept'}
          </button>
        </div>
      )}
    </Shell>
  );
}
