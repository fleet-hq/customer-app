import type { WebsiteTemplate } from '@/services/companyContentServices';

/**
 * Pick the component a tenant's template uses for one surface.
 *
 * Every page used to carry its own ``if (websiteTemplate ===
 * 'template_2') return <XClientT2 />``, so each new template added a
 * branch to fifteen files and nothing failed loudly when one was
 * missed — the page just silently rendered the wrong design. A surface
 * now declares its variants in one object instead.
 *
 * ``template_1`` is required because it is the default every company
 * starts on, which also makes it the safe answer for a surface a newer
 * template has not styled yet: the page renders, in the wrong skin,
 * rather than crashing or coming back blank.
 */
export type TemplateVariants<T> = { template_1: T } & Partial<
  Record<WebsiteTemplate, T>
>;

export function pickTemplateView<T>(
  template: WebsiteTemplate | undefined,
  variants: TemplateVariants<T>,
): T {
  return (template && variants[template]) || variants.template_1;
}
