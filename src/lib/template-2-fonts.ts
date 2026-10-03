import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

/** Loaded once, scoped to the template-2 subtree via CSS variables that
 *  `template-2.module.css` references (`--t2-font-display` etc.) —
 *  never applied at the document root, so template-1 pages are
 *  unaffected even on a mixed-template deployment. */
export const t2Display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--t2-font-display',
  display: 'swap',
});

export const t2Body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--t2-font-body',
  display: 'swap',
});

export const t2Mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--t2-font-mono',
  display: 'swap',
});

export const t2FontVariables = `${t2Display.variable} ${t2Body.variable} ${t2Mono.variable}`;
