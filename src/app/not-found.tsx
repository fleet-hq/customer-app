'use client';

import Link from 'next/link';
import { useOptionalTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';

export default function NotFound() {
  const tenant = useOptionalTenant();
  const brandName = tenant?.name ?? 'the homepage';
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-6 py-[96px] text-center">
      <div className="mb-[14px] text-[12px] font-semibold tracking-[0.08em] text-primary uppercase">
        404 — Page not found
      </div>
      <h1 className="m-0 mb-[14px] text-[30px] leading-[1.18] font-semibold tracking-[-0.02em] text-ink">
        We can&apos;t find that page
      </h1>
      <p className="m-0 mb-[28px] text-[13px] leading-[1.6] text-muted">
        The page you&apos;re looking for may have moved or no longer exists. Head back to {brandName} to keep
        browsing.
      </p>
      <Link
        href={paths.home}
        className="inline-flex items-center gap-[6px] rounded-[10px] bg-primary px-[18px] py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Back to home
      </Link>
    </section>
  );
}
