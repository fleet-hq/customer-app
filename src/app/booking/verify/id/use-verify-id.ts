'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingDetails } from '@/hooks/useBooking';
import { useCreateIdentityVerification } from '@/hooks/useVerification';
import { setBookingToken } from '@/utils/booking-token';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

/** All ID-verification data, state, and handlers — shared verbatim by
 *  both templates' verify-id pages so this compliance-critical
 *  submission logic lives in exactly one place. Templates differ only
 *  in how they render what this returns. This is a pure mechanical
 *  extraction of what used to be inline in page.tsx — nothing about the
 *  logic itself has changed. */
export function useVerifyId() {
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
  const createVerification = useCreateIdentityVerification();

  const [license, setLicense] = useState('');
  const [dob, setDob] = useState('');
  const [issuingState, setIssuingState] = useState('');
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const { t } = useDynamicTranslation([
    'Front of license',
    'Back of license',
    'License number',
    'Date of birth',
    'Issuing state',
    'e.g. D1234-5678-9012',
    'MM / DD / YYYY',
    'e.g. Connecticut',
    'Your documents are encrypted and used only to verify your booking.',
    'Redirecting…',
    'Submit for verification',
    'Failed to create verification session. Please try again.',
  ]);

  const bookingHref = `/booking/${bookingId}${token ? `?token=${token}` : ''}`;

  const submit = () => {
    if (!booking) return;
    setError(null);
    createVerification.mutate(
      { customerId: booking.customerId },
      {
        onSuccess: (data) => {
          if (data.url) {
            setRedirecting(true);
            window.location.href = data.url;
          } else {
            setError('Failed to create verification session. Please try again.');
          }
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { errors?: { non_field_errors?: string[] } } } })?.response?.data?.errors
              ?.non_field_errors?.[0] || 'Failed to create verification session. Please try again.';
          setError(message);
        },
      },
    );
  };

  const pending = createVerification.isPending || redirecting;

  return {
    tenant,
    tokenReady,
    isLoading,
    isError,
    booking,
    bookingHref,
    license,
    setLicense,
    dob,
    setDob,
    issuingState,
    setIssuingState,
    front,
    setFront,
    back,
    setBack,
    error,
    pending,
    t,
    submit,
  };
}
