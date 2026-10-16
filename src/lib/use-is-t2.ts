'use client';

import { useTenant } from '@/lib/tenant-context';

/** Whether this tenant's template uses the *editorial* skin for shared
 *  components.
 *
 *  Shared components are mounted inside every template, and template 1
 *  styles them with Tailwind tokens while templates 2 and 3 style them
 *  with CSS variables on a dark ground. A component that hardcodes one
 *  set disappears in the other, which is what happened to the price
 *  breakdown.
 *
 *  This deliberately stayed a boolean rather than becoming a
 *  per-template switch. The alternative was a third branch beside each
 *  of the ~320 `isT2 ? … : …` expressions, and every new template a
 *  fourth. Instead the editorial classes name CSS variables, and each
 *  template DEFINES those variables in its own scope — so template 3
 *  renders the same markup in its own palette, radius and faces, and a
 *  template 4 needs no component changes at all.
 *
 *  The name is kept for now because 19 files import it; what it means
 *  is "editorial skin", not "is template 2".
 */
export function useIsT2(): boolean {
  const template = useTenant().websiteTemplate;
  return template === 'template_2' || template === 'template_3';
}
