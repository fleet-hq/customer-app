import type { Tenant } from '@/lib/tenant';
import { DEFAULT_LOCALE, type Locale } from './config';
import { applyTenantTranslations, collectTenantStrings } from './translate-tenant';

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const CHUNK = 100;

async function translateChunk(texts: string[], target: string): Promise<string[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/i18n/public-translate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target, source: DEFAULT_LOCALE }),
    });
    if (!res.ok) return texts;
    const data = await res.json();
    const out = data?.translations;
    return Array.isArray(out) && out.length === texts.length ? out : texts;
  } catch {
    return texts;
  }
}

export async function translateTenant(tenant: Tenant, locale: Locale): Promise<Tenant> {
  if (locale === DEFAULT_LOCALE) return tenant;
  const strings = collectTenantStrings(tenant);
  if (!strings.length) return tenant;

  const chunks: string[][] = [];
  for (let i = 0; i < strings.length; i += CHUNK) chunks.push(strings.slice(i, i + CHUNK));
  const translated = (await Promise.all(chunks.map((c) => translateChunk(c, locale)))).flat();

  const map = new Map<string, string>();
  strings.forEach((s, i) => map.set(s, translated[i] ?? s));
  return applyTenantTranslations(tenant, (s) => map.get(s) ?? s);
}
