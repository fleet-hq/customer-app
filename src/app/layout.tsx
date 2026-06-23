import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { TenantProvider } from '@/lib/tenant-context';
import { Providers } from './providers';
import { CompanyProvider } from '@/contexts';
import { LayoutChrome } from '@/components/layout/layout-chrome';
import { ErrorBoundary } from '@/components/error-boundary';
import { StripeProvider } from '@/components/stripe-provider';
import { SetupInProgress } from '@/components/setup-in-progress';

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
  try {
    const tenant = await getCurrentTenant();
    const favicon = tenant.brand.logo || tenant.brand.logoMono;
    return {
      title: `${tenant.name} — Car Rentals`,
      description: tenant.brand.description,
      ...(favicon
        ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } }
        : {}),
    };
  } catch (err) {
    if (err instanceof TenantNotFoundError) {
      return { title: 'Site setup in progress' };
    }
    throw err;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let tenant;
  try {
    tenant = await getCurrentTenant();
  } catch (err) {
    if (err instanceof TenantNotFoundError) {
      const host = (await headers()).get('host') ?? err.host;
      return (
        <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
          <body>
            <SetupInProgress host={host} />
          </body>
        </html>
      );
    }
    throw err;
  }

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
          {/* TenantProvider must wrap CompanyProvider. CompanyProvider
              calls useCompanySettings which reads useTenant for the
              per-tenant queryKey — inverting the order makes the
              tenant context unmounted when CompanyProvider's first
              render fires its hooks, throwing the runtime error
              "useTenant must be used within a TenantProvider". */}
          <TenantProvider tenant={tenant}>
            <CompanyProvider>
              <StripeProvider>
                <LayoutChrome>
                  <ErrorBoundary>{children}</ErrorBoundary>
                </LayoutChrome>
              </StripeProvider>
            </CompanyProvider>
          </TenantProvider>
        </Providers>
      </body>
    </html>
  );
}
