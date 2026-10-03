'use client';

import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { IdCard } from '@/components/ui/icons';
import { Dropzone, ReassuranceStrip } from '@/components/booking/verify-bits';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useVerifyId } from './use-verify-id';
import VerifyIdClientT2 from './verify-id-client-t2';

export default function VerifyIdPage() {
  const vi = useVerifyId();

  if (vi.tenant.websiteTemplate === 'template_2') {
    return <VerifyIdClientT2 />;
  }

  const {
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

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
        <BackLink href={bookingHref}><Dyn>Back to booking</Dyn></BackLink>

        <div className="mt-4 flex items-center gap-[13px]">
          <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <IdCard size={22} className="text-primary" />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink"><Dyn>Verify your identity</Dyn></h1>
            <p className="mt-1 text-[13px] text-muted">
              <Dyn>Add your driver&apos;s license details. This usually verifies within a minute.</Dyn>
            </p>
          </div>
        </div>

        <div className="mt-[22px] rounded-2xl border border-card-border bg-white p-6">
          <label className="mb-[9px] block text-xs font-semibold text-ink"><Dyn>Driver&apos;s license photo</Dyn></label>
          <div className="mb-[22px] grid grid-cols-1 gap-3 min-[560px]:grid-cols-2">
            <Dropzone added={front} onClick={() => setFront(true)} caption={t('Front of license')} />
            <Dropzone added={back} onClick={() => setBack(true)} caption={t('Back of license')} />
          </div>

          <div className="grid grid-cols-1 gap-x-3 gap-y-[14px] min-[560px]:grid-cols-2">
            <Field label={t('License number')} className="min-[560px]:col-span-2">
              <TextInput value={license} onChange={(e) => setLicense(e.target.value)} placeholder={t('e.g. D1234-5678-9012')} />
            </Field>
            <Field label={t('Date of birth')}>
              <TextInput value={dob} onChange={(e) => setDob(e.target.value)} placeholder={t('MM / DD / YYYY')} />
            </Field>
            <Field label={t('Issuing state')}>
              <TextInput value={issuingState} onChange={(e) => setIssuingState(e.target.value)} placeholder={t('e.g. Connecticut')} />
            </Field>
          </div>

          <ReassuranceStrip text={t('Your documents are encrypted and used only to verify your booking.')} />
        </div>

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
            {pending ? t('Redirecting…') : t('Submit for verification')}
          </button>
        </div>
      </section>
    </div>
  );
}
