'use client';

import type { CSSProperties, ReactNode } from 'react';
import { t3FontVariables } from '@/lib/template-3-fonts';
import { useTenant } from '@/lib/tenant-context';
import styles from '@/styles/template-3.module.css';

/** Derive the shades the template needs from one accent, so a tenant
 *  who sets a single brand colour still gets a coherent skin rather
 *  than their colour next to the stock green. */
function accentShades(accent: string): Record<string, string> {
  return {
    '--t3-accent': accent,
    '--t3-accent-50': `color-mix(in srgb, ${accent} 14%, #ffffff)`,
    '--t3-accent-200': `color-mix(in srgb, ${accent} 52%, #ffffff)`,
    '--t3-accent-700': `color-mix(in srgb, ${accent} 72%, #000000)`,
    '--t3-accent-900': `color-mix(in srgb, ${accent} 38%, #000000)`,
  };
}

export function T3Shell({ children }: { children: ReactNode }) {
  const settings = useTenant().sections.template_3;

  const style: CSSProperties = {};
  const vars = style as Record<string, string>;

  if (settings?.accent) Object.assign(vars, accentShades(settings.accent));
  // An explicit value always outranks the derived one above.
  if (settings?.accent_soft) vars['--t3-accent-200'] = settings.accent_soft;
  if (settings?.accent_deep) vars['--t3-accent-700'] = settings.accent_deep;
  if (settings?.charcoal) {
    vars['--t3-char'] = settings.charcoal;
    vars['--t3-char-2'] = `color-mix(in srgb, ${settings.charcoal} 94%, #ffffff)`;
  }
  if (settings?.offwhite) vars['--t3-paper'] = settings.offwhite;

  return (
    <div className={`${styles.t3} ${t3FontVariables}`} style={style}>
      {children}
    </div>
  );
}
