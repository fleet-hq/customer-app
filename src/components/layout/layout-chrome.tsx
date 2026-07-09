'use client';

import type { ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';

const HIDE_CHROME_PREFIXES = ['/sign-in', '/register'];

export function LayoutChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const hideChrome =
    searchParams.get('embed') === '1' ||
    HIDE_CHROME_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  return (
    <>
      {!hideChrome && <Header />}
      <main className="bg-white text-ink">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
