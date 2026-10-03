'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';
import { HeaderT2 } from './header-t2';
import { FooterT2 } from './footer-t2';
import { T2Shell } from './t2-shell';
import { useTenant } from '@/lib/tenant-context';

const HIDE_CHROME_PREFIXES = ['/sign-in', '/register'];

export function LayoutChrome({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [insideIframe, setInsideIframe] = useState(false);

  useEffect(() => {
    setInsideIframe(typeof window !== 'undefined' && window.parent !== window);
  }, []);

  const hideChrome =
    searchParams.get('embed') === '1' ||
    insideIframe ||
    HIDE_CHROME_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  // ``?embed=bare`` (or the paired ``?bare=1`` used by /search) drops the
  // main element's white fill so the partner site's own background shows
  // through the iframe. Regular embeds keep the white so per-page content
  // reads as designed.
  const bareBackground =
    searchParams.get('bare') === '1' || searchParams.get('embed') === 'bare';

  if (isT2) {
    return (
      <T2Shell>
        {!hideChrome && <HeaderT2 />}
        <main>{children}</main>
        {!hideChrome && <FooterT2 />}
      </T2Shell>
    );
  }

  return (
    <>
      {!hideChrome && <Header />}
      <main className={bareBackground ? 'text-ink' : 'bg-white text-ink'}>{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
