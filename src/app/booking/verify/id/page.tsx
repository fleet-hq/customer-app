'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { IdCard } from '@/components/ui/icons';
import { Dropzone, ReassuranceStrip } from '@/components/booking/verify-bits';
import { paths } from '@/lib/paths';
import { setIdVerified } from '@/lib/booking-state';

export default function VerifyIdPage() {
  const router = useRouter();
  const [license, setLicense] = useState('');
  const [dob, setDob] = useState('');
  const [issuingState, setIssuingState] = useState('');
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);

  const submit = () => {
    setIdVerified();
    router.push(paths.confirm);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <section className="mx-auto w-full max-w-[600px] flex-1 px-6 pt-7 pb-[72px]">
        <BackLink href={paths.confirm}>Back to confirmation</BackLink>

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

        <div className="mt-[22px] flex items-center gap-3">
          <button
            onClick={() => router.push(paths.confirm)}
            className="flex-shrink-0 rounded-[10px] border border-line bg-white px-[26px] py-[13px] text-sm font-semibold text-ink"
          >
            Cancel
          </button>
          <button onClick={submit} className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-bold text-white">
            Submit for verification
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
