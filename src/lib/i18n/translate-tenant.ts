import type { Tenant } from '@/lib/tenant';

const SKIP = new Set([
  'seo', 'meta', 'schema', 'images', 'image', 'tracking',
  'og_image', 'og_image_alt', 'og_title', 'og_description',
  'meta_title', 'meta_description',
  'href', 'url', 'cta_href', 'src', 'video', 'background',
  'icon', 'color', 'highlight_color', 'highlight_words', 'layout',
  'slug', 'id', 'key', 'type', 'name',
  'email', 'phone', 'whatsapp', 'currency', 'logo', 'logo_color',
  'lat', 'lng', 'latitude', 'longitude', 'price', 'price_range',
]);

function isTranslatable(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  if (/^https?:\/\//i.test(t)) return false;
  if (/^\/[^\s]*$/.test(t)) return false;
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(t)) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return false;
  if (/^[\d\s.,$€+%/-]+$/.test(t)) return false;
  return true;
}

function collect(node: unknown, out: Set<string>): void {
  if (typeof node === 'string') {
    if (isTranslatable(node)) out.add(node);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((n) => collect(n, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (SKIP.has(k)) continue;
      collect(v, out);
    }
  }
}

function rebuild<T>(node: T, t: (s: string) => string): T {
  if (typeof node === 'string') {
    return (isTranslatable(node) ? t(node) : node) as unknown as T;
  }
  if (Array.isArray(node)) {
    return node.map((n) => rebuild(n, t)) as unknown as T;
  }
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = SKIP.has(k) ? v : rebuild(v, t);
    }
    return out as unknown as T;
  }
  return node;
}

/** Every translatable string in the parts of the tenant that render as
 *  on-page copy: the content ``sections`` plus the header nav labels. */
export function collectTenantStrings(tenant: Tenant): string[] {
  const out = new Set<string>();
  collect(tenant.sections, out);
  (tenant.brand?.navLinks ?? []).forEach((l) => {
    if (l?.label && isTranslatable(l.label)) out.add(l.label);
  });
  return Array.from(out);
}

/** Rebuild the tenant with every collected string replaced by ``t(str)``.
 *  Only ``sections`` and nav labels are walked — brand name, images,
 *  URLs, colors, prices and contact details are left untouched. */
export function applyTenantTranslations(
  tenant: Tenant,
  t: (s: string) => string,
): Tenant {
  const sections = rebuild(tenant.sections, t);
  const navLinks = (tenant.brand?.navLinks ?? []).map((l) =>
    l?.label && isTranslatable(l.label) ? { ...l, label: t(l.label) } : l,
  );
  return {
    ...tenant,
    sections,
    brand: { ...tenant.brand, navLinks },
  };
}
