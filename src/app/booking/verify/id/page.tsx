'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { IdCard } from '@/components/ui/icons';
import { Dropzone, ReassuranceStrip } from '@/components/booking/verify-bits';
import { useBookingDetails } from '@/hooks/useBooking';
import { useCreateIdentityVerification } from '@/hooks/useVerification';
import { setBookingToken } from '@/utils/booking-token';
import { paths } from '@/lib/paths';

export default function VerifyIdPage() {
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

  if (!tokenReady || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
          <BackLink href={paths.home}>Back to home</BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink">Booking not found</h1>
            <p className="mt-3 text-sm text-muted">
              We couldn’t load this booking. Please use the link from your confirmation email.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const pending = createVerification.isPending || redirecting;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
        <BackLink href={bookingHref}>Back to booking</BackLink>

        <div className="mt-4 flex items-center gap-[13px]">
          <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <IdCard size={22} className="text-primary" />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Verify your identity</h1>
            <p className="mt-1 text-[13px] text-muted">
              Add your driver&apos;s license details. This usually verifies within a minute.
            </p>
          </div>
        </div>

        <div className="mt-[22px] rounded-2xl border border-card-border bg-white p-6">
          <label className="mb-[9px] block text-xs font-semibold text-ink">Driver&apos;s license photo</label>
          <div className="mb-[22px] grid grid-cols-1 gap-3 min-[560px]:grid-cols-2">
            <Dropzone added={front} onClick={() => setFront(true)} caption="Front of license" />
            <Dropzone added={back} onClick={() => setBack(true)} caption="Back of license" />
          </div>

          <div className="grid grid-cols-1 gap-x-3 gap-y-[14px] min-[560px]:grid-cols-2">
            <Field label="License number" className="min-[560px]:col-span-2">
              <TextInput value={license} onChange={(e) => setLicense(e.target.value)} placeholder="e.g. D1234-5678-9012" />
            </Field>
            <Field label="Date of birth">
              <TextInput value={dob} onChange={(e) => setDob(e.target.value)} placeholder="MM / DD / YYYY" />
            </Field>
            <Field label="Issuing state">
              <TextInput value={issuingState} onChange={(e) => setIssuingState(e.target.value)} placeholder="e.g. Connecticut" />
            </Field>
          </div>

          <ReassuranceStrip text="Your documents are encrypted and used only to verify your booking." />
        </div>

        {error && (
          <p className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-[22px] flex items-center gap-3">
          <a
            href={bookingHref}
            className="flex-shrink-0 rounded-[10px] border border-line bg-white px-[26px] py-[13px] text-sm font-semibold text-ink"
          >
            Cancel
          </a>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-bold text-white disabled:opacity-60"
          >
            {pending ? 'Redirecting…' : 'Submit for verification'}
          </button>
        </div>
      </section>
    </div>
  );
}
