'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/locale-context';
import { queueTranslate } from '@/services/i18nServices';
import esMessages from '@/lib/i18n/messages.es.json';

// Bundled, pre-translated catalog of the app's fixed UI strings. Available
// synchronously on both server and client, so these render in the target
// language on the very first paint — no MT round-trip, no flash.
const STATIC: Record<string, Record<string, string>> = { es: esMessages as Record<string, string> };

function staticLookup(locale: string, text: string): string | undefined {
  return STATIC[locale]?.[text];
}

const mem = new Map<string, string>();

const CACHE_VERSION = 'v4';
const cacheKey = (locale: string, text: string, fmt: 'text' | 'html') =>
  `${CACHE_VERSION}:${fmt}:${locale}:${text}`;

function readCache(key: string): string | undefined {
  if (mem.has(key)) return mem.get(key);
  try {
    const v = localStorage.getItem(`mt:${key}`);
    if (v != null) {
      mem.set(key, v);
      return v;
    }
  } catch {
    /* localStorage unavailable (SSR, private mode) */
  }
  return undefined;
}

function writeCache(key: string, value: string) {
  mem.set(key, value);
  try {
    localStorage.setItem(`mt:${key}`, value);
  } catch {
    /* quota or unavailable */
  }
}

async function translateAll(texts: string[], locale: string, fmt: 'text' | 'html'): Promise<string[]> {
  // queueTranslate coalesces these with every other in-flight translation
  // request across the page into a few batched calls.
  const results = await Promise.all(texts.map((txt) => queueTranslate(txt, locale, fmt)));
  // Persist only results from a successful request (``ok``) — including ones
  // that came back unchanged (legitimately same word). A failed request
  // (``ok: false``) is never cached, so a transient outage can't freeze a
  // string in English; it simply retries next time.
  texts.forEach((src, i) => {
    const r = results[i];
    if (r?.ok) writeCache(cacheKey(locale, src, fmt), r.value);
  });
  return results.map((r) => r.value);
}

export function useDynamicTranslation(
  texts: (string | null | undefined)[],
  opts?: { html?: boolean },
) {
  const fmt: 'text' | 'html' = opts?.html ? 'html' : 'text';
  const locale = useLocale();
  // ``mounted`` gates the cache read: the first client render must match the
  // server (which rendered the original text), so we return the original
  // until after mount, then swap to the cached translation. This avoids both
  // a hydration mismatch and the layout collapse an empty string would cause.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const clean = Array.from(
    new Set(texts.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)),
  );
  const enabled = locale !== DEFAULT_LOCALE && clean.length > 0;

  // Strings not covered by the bundled catalog are the only ones that need MT.
  const needsMt = enabled ? clean.filter((s) => staticLookup(locale, s) === undefined) : [];
  const missing = mounted ? needsMt.filter((s) => readCache(cacheKey(locale, s, fmt)) === undefined) : needsMt;

  const { isFetched } = useQuery({
    queryKey: ['dynamic-translation', fmt, locale, missing],
    queryFn: () => translateAll(missing, locale, fmt),
    enabled: mounted && enabled && missing.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    t: (text?: string | null): string => {
      if (typeof text !== 'string' || !text) return typeof text === 'string' ? text : '';
      if (!enabled) return text;
      // Catalog hit → synchronous, works pre-mount and during SSR (so no
      // flash and no hydration mismatch).
      const stat = staticLookup(locale, text);
      if (stat !== undefined) return stat;
      if (!mounted) return text;
      return readCache(cacheKey(locale, text, fmt)) ?? text;
    },
    // Ready when nothing needs MT (all catalog/cached), or the MT fetch has
    // completed (even if some strings failed) — so a spinner never hangs.
    ready: !enabled || needsMt.length === 0 || (mounted && (missing.length === 0 || isFetched)),
  };
}
