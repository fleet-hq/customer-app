import { Barlow_Condensed, Inter } from 'next/font/google';

/** Scoped to the template-3 subtree through CSS variables that
 *  `template-3.module.css` reads — never applied at the document root,
 *  so template-1 and template-2 pages are untouched on a mixed
 *  deployment. Mirrors how template 2 loads its own faces. */
export const t3Display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--t3-font-display',
  display: 'swap',
});

export const t3Body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--t3-font-body',
  display: 'swap',
});

export const t3FontVariables = `${t3Display.variable} ${t3Body.variable}`;
