import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { getCurrentTenant } from '@/lib/get-tenant';
import { TenantProvider } from '@/lib/tenant-context';
import { Providers } from './providers';
import { CompanyProvider } from '@/contexts';

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
  return {
    title: `${tenant.name} — Car Rentals`,
    description: tenant.brandDesc,
    icons: { icon: tenant.logoMono ?? tenant.logo },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant();
  const { theme } = tenant;

  const brandVars = {
    '--color-primary': theme.primary,
    '--color-secondary': theme.secondary,
    '--color-primary-hover': theme.primaryHover,
    '--color-accent': theme.accent,
  } as React.CSSProperties;

  return (
    <html lang="en" data-tenant={tenant.slug} style={brandVars} className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <Providers>
          <CompanyProvider>
            <TenantProvider tenant={tenant}>{children}</TenantProvider>
          </CompanyProvider>
        </Providers>
      </body>
    </html>
  );
}
