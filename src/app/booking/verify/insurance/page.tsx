'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { ShieldCheck } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useBookingDetails } from '@/hooks/useBooking';
import { useCreateInsuranceVerification } from '@/hooks/useVerification';
import { setBookingToken } from '@/utils/booking-token';
import { paths } from '@/lib/paths';
import { Dropzone, ReassuranceStrip } from '@/components/booking/verify-bits';

export default function VerifyInsurancePage() {
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

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
          <BackLink href={bookingHref}>Back to booking</BackLink>
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
              <ShieldCheck size={22} className="text-primary" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold text-ink">Check your email</h1>
            <p className="mt-3 text-sm text-muted">
              We&apos;ve emailed you a secure link to verify your insurance. Follow it to finish, then return to your booking.
            </p>
            <a
              href={bookingHref}
              className="mt-8 rounded-[10px] bg-primary px-[26px] py-[13px] text-sm font-bold text-white"
            >
              Back to booking
            </a>
          </div>
        </section>
      </div>
    );
  }

  const pending = createVerification.isPending;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
        <BackLink href={bookingHref}>Back to booking</BackLink>

        <div className="mt-4 flex items-center gap-[13px]">
          <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <ShieldCheck size={22} className="text-primary" />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Verify your insurance</h1>
            <p className="mt-1 text-[13px] text-muted">
              Confirm the protection you selected, or add your own coverage details.
            </p>
          </div>
        </div>

        <div className="mt-[22px] flex flex-col gap-3">
          <OptionCard selected={!useOwn} onClick={() => setMode('plan')}>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">Use Standard Protection</div>
              <div className="mt-0.5 text-xs text-faint">
                The plan you selected at checkout — $29.99/day. Nothing else to upload.
              </div>
            </div>
            <span className="rounded-full bg-primary-soft px-[9px] py-[3px] text-[10px] font-semibold whitespace-nowrap text-primary">
              Recommended
            </span>
          </OptionCard>

          <OptionCard selected={useOwn} onClick={() => setMode('own')}>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">I&apos;ll use my own coverage</div>
              <div className="mt-0.5 text-xs text-faint">Add your provider details and proof of active coverage.</div>
            </div>
          </OptionCard>
        </div>

        {useOwn && (
          <div className="mt-4 rounded-2xl border border-card-border bg-white p-6">
            <div className="grid grid-cols-1 gap-x-3 gap-y-[14px] min-[560px]:grid-cols-2">
              <Field label="Insurance provider">
                <TextInput value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. GEICO" />
              </Field>
              <Field label="Policy number">
                <TextInput value={policy} onChange={(e) => setPolicy(e.target.value)} placeholder="e.g. 9921-AC-77" />
              </Field>
            </div>
            <label className="mt-4 mb-[9px] block text-xs font-medium text-label">Proof of coverage</label>
            <Dropzone added={proof} onClick={() => setProof(true)} caption="PDF or photo of your insurance card" label="File added" />
          </div>
        )}

        <ReassuranceStrip text="Your coverage details are encrypted and used only to verify your booking." />

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
            {pending ? 'Sending…' : useOwn ? 'Submit for verification' : 'Confirm protection'}
          </button>
        </div>
      </section>
    </div>
  );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-[13px] rounded-[13px] p-4',
        selected ? 'border-[1.5px] border-primary bg-primary-soft' : 'border border-line bg-white',
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
          selected ? 'border-[6px] border-primary bg-primary' : 'border-[1.5px] border-control bg-white',
        )}
      >
        {selected && <span className="h-[9px] w-[9px] rounded-full bg-white" />}
      </span>
      {children}
    </div>
  );
}
