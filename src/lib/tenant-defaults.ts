import type { BrandTheme, NavLink } from '@/services/companyContentServices';

/** Theme defaults — CSS custom properties MUST resolve to a value or
 *  every styled element falls back to ``initial``, breaking the page.
 *  These are intentionally generic so a brand-new tenant still renders
 *  in a sane palette; everything else (logos, copy, images) is left
 *  blank when the operator hasn't configured it. */
export const DEFAULT_THEME: BrandTheme = {
  primary: '#ED2324',
  secondary: '#000000',
  primary_hover: '#D11F20',
  accent: '#E0921A',
};

/** Header nav defaults — used only when the company hasn't supplied
 *  any nav links yet. A header with zero links would otherwise look
 *  broken. */
export const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'About', href: '/#about' },
  { label: 'Fleet', href: '/fleet' },
  { label: 'FAQs', href: '/#faqs' },
  { label: 'Contact', href: '/#contact' },
];
