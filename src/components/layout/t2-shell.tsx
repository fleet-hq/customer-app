'use client';

import type { CSSProperties, ReactNode } from 'react';
import { t2FontVariables } from '@/lib/template-2-fonts';
import { useTenant } from '@/lib/tenant-context';
import styles from '@/styles/template-2.module.css';

function readableOn(background: string): string | null {
  const hex = background.trim().replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  const channel = (start: number) => {
    const v = parseInt(full.slice(start, start + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.45 ? '#1a1206' : '#ffffff';
}

export function T2Shell({ children }: { children: ReactNode }) {
  const settings = useTenant().sections.template_2;

  const style: CSSProperties = {};
  const vars = style as Record<string, string>;
  if (settings?.brass) {
    vars['--brass'] = settings.brass;
    // Buttons and chips put their label directly on the accent. The
    // template's default near-black only reads well on gold — a darker
    // accent (a red or navy brand colour) needs a light label instead.
    const onAccent = readableOn(settings.brass);
    if (onAccent) vars['--on-brass'] = onAccent;
  }
  if (settings?.brass_bright) vars['--brass-bright'] = settings.brass_bright;
  if (settings?.ink) {
    vars['--ink'] = settings.ink;
    // The footer sits on a slightly lifted shade of ink; derive it so a
    // custom ink doesn't leave the footer on the stock colour.
    vars['--ink-2'] = `color-mix(in srgb, ${settings.ink} 92%, #ffffff)`;
  }
  if (settings?.band) vars['--band-navy'] = settings.band;

  return (
    <div className={`${styles.t2} ${t2FontVariables}`} style={style}>
      {children}
    </div>
  );
}
