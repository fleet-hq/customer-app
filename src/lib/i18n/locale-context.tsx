'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeCookie(locale: Locale) {
  try {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${oneYear};samesite=lax`;
  } catch {
    /* document unavailable */
  }
}

export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeCookie(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext)?.locale ?? DEFAULT_LOCALE;
}

export function useSetLocale(): (locale: Locale) => void {
  const ctx = useContext(LocaleContext);
  return ctx?.setLocale ?? (() => {});
}
