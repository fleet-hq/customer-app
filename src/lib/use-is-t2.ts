'use client';

import { useTenant } from '@/lib/tenant-context';

/** Whether the tenant renders the second site design.
 *
 *  Shared components are mounted inside both templates, and the two use
 *  different colour systems — template 1 has Tailwind tokens, template 2
 *  has CSS variables on a dark ground. A component that hardcodes one
 *  set disappears in the other, which is what happened to the price
 *  breakdown. Asking here keeps that question in one place instead of
 *  the same expression spelled out in each component.
 */
export function useIsT2(): boolean {
  return useTenant().websiteTemplate === 'template_2';
}
