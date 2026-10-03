'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgreement, useAcceptAgreement } from '@/hooks/useAgreements';
import type { AgreementData } from '@/services/agreementServices';

/** All /rental-agreement/[agreementId] data, state, and handlers —
 *  shared verbatim by both templates. Mechanical extraction of what
 *  used to be inline in page.tsx; nothing about the logic has changed.
 *  A ``temp-agreement-*`` id resolves from a `localStorage` draft
 *  instead of the API (pre-booking preview flow); any other id fetches
 *  the real agreement. */
export function useAgreementDetail(agreementId: string) {
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

  const isSigned = !!agreement && (agreement.status === 'signed' || !!agreement.signatureImage);

  return {
    agreement,
    isLoading,
    isError,
    localError,
    agree,
    setAgree,
    signature,
    setSignature,
    error,
    accepting,
    handleAccept,
    isSigned,
  };
}
