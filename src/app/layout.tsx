import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { getCurrentTenant } from '@/lib/get-tenant';
import { TenantProvider } from '@/lib/tenant-context';
import { Providers } from './providers';
import { CompanyProvider } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope-src',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  // Favicon priority is color-logo first because browser tabs render
  // on a light background; the mono variant is the dark-mode fallback.
  // Apple-touch-icon uses the same source so iOS home-screen shortcuts
  // match the brand without a separate upload.
  const favicon = tenant.brand.logo || tenant.brand.logoMono;
  return {
    title: `${tenant.name} — Car Rentals`,
    description: tenant.brand.description,
    // Only emit icon metadata when the tenant has uploaded a logo —
    // otherwise let the browser fall back to its own default rather
    // than serving a broken/empty icon.
    ...(favicon
      ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } }
      : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant();
  const { theme } = tenant.brand;

  const brandVars = {
    '--color-primary': theme.primary,
    '--color-secondary': theme.secondary,
    '--color-primary-hover': theme.primary_hover,
    '--color-accent': theme.accent,
  } as React.CSSProperties;

  return (
    <html lang="en" data-tenant={tenant.slug} style={brandVars} className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <Providers>
          <CompanyProvider>
            <TenantProvider tenant={tenant}>
              {/* Header + Footer live at the layout level so client-
                  side navigation keeps them mounted. The logo image
                  stops re-fetching on every route change. */}
              <Header />
              <main className="bg-white text-ink">{children}</main>
              <Footer />
            </TenantProvider>
          </CompanyProvider>
        </Providers>
      </body>
    </html>
  );
}
