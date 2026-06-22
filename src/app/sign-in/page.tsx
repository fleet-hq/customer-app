'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Field, TextInput } from '@/components/ui/field';
import { Check } from '@/components/ui/icons';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';

export default function SignInPage() {
  const tenant = useTenant();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keep, setKeep] = useState(true);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-14">
        <div className="rounded-2xl border border-card-border bg-white p-8 shadow-[var(--shadow-card)]">
          {tenant.brand.logo ? (
            <Image src={tenant.brand.logo} alt={tenant.name} width={412} height={412} className="h-12 w-auto" unoptimized />
          ) : (
            <span className="block text-[20px] font-semibold tracking-[-0.01em] text-ink">{tenant.name}</span>
          )}

          <h1 className="mt-7 text-2xl font-semibold tracking-[-0.01em] text-ink">Welcome back</h1>
          <p className="mt-[6px] text-[13.5px] text-muted">Sign in to manage your bookings.</p>

          <div className="mt-6 flex flex-col gap-[16px]">
            <Field label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </Field>
            <Field label="Password">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setKeep((k) => !k)} className="flex items-center gap-[9px] text-[12.5px] font-medium text-ink">
              <span
                className={cn(
                  'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                  keep ? 'border-primary bg-primary' : 'border-control bg-white',
                )}
              >
                {keep && <Check size={12} strokeWidth={3} className="text-white" />}
              </span>
              Keep me signed in
            </button>
            <Link href="#" className="text-[12.5px] font-semibold text-primary">Forgot password?</Link>
          </div>

          <button
            onClick={() => router.push(paths.manage)}
            className="mt-6 w-full rounded-[10px] bg-primary py-[14px] text-sm font-bold text-white hover:bg-primary-hover"
          >
            Sign in
          </button>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-card-border" />
            <span className="text-[11px] font-medium text-faint">or</span>
            <span className="h-px flex-1 bg-card-border" />
          </div>

          <Link
            href={paths.home}
            className="block w-full rounded-[10px] border border-line bg-white py-[13px] text-center text-sm font-semibold text-ink"
          >
            Continue as guest
          </Link>

          <p className="mt-6 text-center text-[13px] text-muted">
            New here? <Link href={paths.register} className="font-semibold text-primary">Register</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
