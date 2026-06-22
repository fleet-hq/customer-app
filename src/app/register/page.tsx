'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Field, TextInput } from '@/components/ui/field';
import { Check } from '@/components/ui/icons';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';
import { DEMO_USER } from '@/lib/mock-data';
import { paths } from '@/lib/paths';

export default function RegisterPage() {
  const tenant = useTenant();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-6 py-14">
        <div className="rounded-2xl border border-card-border bg-white p-8 shadow-[var(--shadow-card)]">
          {tenant.brand.logo ? (
            <Image src={tenant.brand.logo} alt={tenant.name} width={412} height={412} className="h-12 w-auto" unoptimized />
          ) : (
            <span className="block text-[20px] font-semibold tracking-[-0.01em] text-ink">{tenant.name}</span>
          )}

          <h1 className="mt-7 text-2xl font-semibold tracking-[-0.01em] text-ink">Create your account</h1>
          <p className="mt-[6px] text-[13.5px] text-muted">Book faster and manage every reservation in one place.</p>

          <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-[16px] min-[520px]:grid-cols-2">
            <Field label="Full name" className="min-[520px]:col-span-2">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={DEMO_USER.name} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </Field>
            <Field label="Phone">
              <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={DEMO_USER.phone} />
            </Field>
            <Field label="Password" className="min-[520px]:col-span-2">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
            </Field>
          </div>

          <button onClick={() => setAgree((a) => !a)} className="mt-5 flex items-start gap-[10px] text-left text-[12.5px] font-medium text-ink">
            <span
              className={cn(
                'mt-px flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                agree ? 'border-primary bg-primary' : 'border-control bg-white',
              )}
            >
              {agree && <Check size={12} strokeWidth={3} className="text-white" />}
            </span>
            <span className="leading-[1.5]">
              I agree to the <Link href={paths.terms} className="font-semibold text-primary">Terms of Service</Link>.
            </span>
          </button>

          <button
            disabled={!agree}
            onClick={() => router.push(paths.manage)}
            className={cn(
              'mt-6 w-full rounded-[10px] py-[14px] text-sm font-bold text-white',
              agree ? 'bg-primary hover:bg-primary-hover' : 'cursor-not-allowed bg-locked',
            )}
          >
            Create account
          </button>

          <p className="mt-6 text-center text-[13px] text-muted">
            Already have an account? <Link href={paths.signIn} className="font-semibold text-primary">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
