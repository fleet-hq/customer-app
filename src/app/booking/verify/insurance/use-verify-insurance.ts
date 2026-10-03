'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingDetails } from '@/hooks/useBooking';
import { useCreateInsuranceVerification } from '@/hooks/useVerification';
import { setBookingToken } from '@/utils/booking-token';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

/** All insurance-verification data, state, and handlers — shared
 *  verbatim by both templates' verify-insurance pages so this
 *  compliance-critical submission logic lives in exactly one place.
 *  Templates differ only in how they render what this returns. This is
 *  a pure mechanical extraction of what used to be inline in page.tsx —
 *  nothing about the logic itself has changed. */
export function useVerifyInsurance() {
  const tenant = useTenant();
  const bookingId = useSearchParams().get('bookingId');
  const token = useSearchParams().get('token');
  const [tokenReady, setTokenReady] = useState(!token);

  useEffect(() => {
    if (token) {
      setBookingToken(token);
      setTokenReady(true);
    }
  }, [token]);

  const fetchId = tokenReady ? bookingId ?? undefined : undefined;
  const { data: booking, isLoading, isError } = useBookingDetails(fetchId);
  const createVerification = useCreateInsuranceVerification();

  const [mode, setMode] = useState<'plan' | 'own'>('plan');
  const [provider, setProvider] = useState('');
  const [policy, setPolicy] = useState('');
  const [proof, setProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const useOwn = mode === 'own';
  const { t } = useDynamicTranslation([
    'Insurance provider',
    'e.g. GEICO',
    'Policy number',
    'e.g. 9921-AC-77',
    'PDF or photo of your insurance card',
    'File added',
    'Your coverage details are encrypted and used only to verify your booking.',
    'Sending…',
    'Submit for verification',
    'Confirm protection',
    'Failed to create insurance verification. Please try again.',
  ]);

  const bookingHref = `/booking/${bookingId}${token ? `?token=${token}` : ''}`;

  const submit = () => {
    if (!booking) return;
    setError(null);
    createVerification.mutate(
      {
        customerId: booking.customerId,
        rentalStartDate: booking.pickUp.rawDatetime.slice(0, 10),
        rentalEndDate: booking.dropOff.rawDatetime.slice(0, 10),
        bookingId: bookingId ?? undefined,
      },
      {
        onSuccess: () => setSent(true),
        onError: (err: unknown) => {
          const errData =
            (err as { response?: { data?: Record<string, unknown> } })?.response?.data?.errors ??
            (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
          let message = 'Failed to create insurance verification. Please try again.';
          if (errData && typeof errData === 'object') {
            const data = errData as Record<string, unknown>;
            if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
              message = String(data.non_field_errors[0]);
            } else if (data.detail) {
              message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
            } else {
              const firstKey = Object.keys(data)[0];
              if (firstKey) {
                const val = data[firstKey];
                message = Array.isArray(val) ? String(val[0]) : String(val);
              }
            }
          }
          setError(message);
        },
      },
    );
  };

  const pending = createVerification.isPending;

  return {
    tenant,
    tokenReady,
    isLoading,
    isError,
    booking,
    mode,
    setMode,
    provider,
    setProvider,
    policy,
    setPolicy,
    proof,
    setProof,
    error,
    sent,
    useOwn,
    t,
    bookingHref,
    submit,
    pending,
  };
}
