'use client';

import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { ShieldCheck } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { Dropzone, ReassuranceStrip } from '@/components/booking/verify-bits';
import { Dyn } from '@/components/i18n/Dyn';
import { useVerifyInsurance } from './use-verify-insurance';
import VerifyInsuranceClientT2 from './verify-insurance-client-t2';

export default function VerifyInsurancePage() {
  const vi = useVerifyInsurance();

  if (vi.tenant.websiteTemplate === 'template_2') {
    return <VerifyInsuranceClientT2 />;
  }

  const {
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
  } = vi;

  if (!tokenReady || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted"><Dyn>Loading booking…</Dyn></p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
          <BackLink href={paths.home}><Dyn>Back to home</Dyn></BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink"><Dyn>Booking not found</Dyn></h1>
            <p className="mt-3 text-sm text-muted">
              <Dyn>We couldn’t load this booking. Please use the link from your confirmation email.</Dyn>
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
          <BackLink href={bookingHref}><Dyn>Back to booking</Dyn></BackLink>
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
              <ShieldCheck size={22} className="text-primary" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold text-ink"><Dyn>Check your email</Dyn></h1>
            <p className="mt-3 text-sm text-muted">
              <Dyn>We&apos;ve emailed you a secure link to verify your insurance. Follow it to finish, then return to your booking.</Dyn>
            </p>
            <a
              href={bookingHref}
              className="mt-8 rounded-[10px] bg-primary px-[26px] py-[13px] text-sm font-bold text-white"
            >
              <Dyn>Back to booking</Dyn>
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
        <BackLink href={bookingHref}><Dyn>Back to booking</Dyn></BackLink>

        <div className="mt-4 flex items-center gap-[13px]">
          <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <ShieldCheck size={22} className="text-primary" />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink"><Dyn>Verify your insurance</Dyn></h1>
            <p className="mt-1 text-[13px] text-muted">
              <Dyn>Confirm the protection you selected, or add your own coverage details.</Dyn>
            </p>
          </div>
        </div>

        <div className="mt-[22px] flex flex-col gap-3">
          <OptionCard selected={!useOwn} onClick={() => setMode('plan')}>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink"><Dyn>Use Standard Protection</Dyn></div>
              <div className="mt-0.5 text-xs text-faint">
                <Dyn>The plan you selected at checkout — $29.99/day. Nothing else to upload.</Dyn>
              </div>
            </div>
            <span className="rounded-full bg-primary-soft px-[9px] py-[3px] text-[10px] font-semibold whitespace-nowrap text-primary">
              <Dyn>Recommended</Dyn>
            </span>
          </OptionCard>

          <OptionCard selected={useOwn} onClick={() => setMode('own')}>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink"><Dyn>I&apos;ll use my own coverage</Dyn></div>
              <div className="mt-0.5 text-xs text-faint"><Dyn>Add your provider details and proof of active coverage.</Dyn></div>
            </div>
          </OptionCard>
        </div>

        {useOwn && (
          <div className="mt-4 rounded-2xl border border-card-border bg-white p-6">
            <div className="grid grid-cols-1 gap-x-3 gap-y-[14px] min-[560px]:grid-cols-2">
              <Field label={t('Insurance provider')}>
                <TextInput value={provider} onChange={(e) => setProvider(e.target.value)} placeholder={t('e.g. GEICO')} />
              </Field>
              <Field label={t('Policy number')}>
                <TextInput value={policy} onChange={(e) => setPolicy(e.target.value)} placeholder={t('e.g. 9921-AC-77')} />
              </Field>
            </div>
            <label className="mt-4 mb-[9px] block text-xs font-medium text-label"><Dyn>Proof of coverage</Dyn></label>
            <Dropzone added={proof} onClick={() => setProof(true)} caption={t('PDF or photo of your insurance card')} label={t('File added')} />
          </div>
        )}

        <ReassuranceStrip text={t('Your coverage details are encrypted and used only to verify your booking.')} />

        {error && (
          <p className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{t(error)}</p>
        )}

        <div className="mt-[22px] flex items-center gap-3">
          <a
            href={bookingHref}
            className="flex-shrink-0 rounded-[10px] border border-line bg-white px-[26px] py-[13px] text-sm font-semibold text-ink"
          >
            <Dyn>Cancel</Dyn>
          </a>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-bold text-white disabled:opacity-60"
          >
            {pending ? t('Sending…') : useOwn ? t('Submit for verification') : t('Confirm protection')}
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
