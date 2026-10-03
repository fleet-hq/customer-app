'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { useLocale, useSetLocale } from '@/lib/i18n/locale-context';

function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-[4px] ring-1 ring-black/[0.08]',
        className,
      )}
    >
      {locale === 'es' ? (
        <svg viewBox="0 0 20 14" className="h-full w-full" aria-hidden>
          <rect width="20" height="14" fill="#AA151B" />
          <rect y="3.5" width="20" height="7" fill="#F1BF00" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 14" className="h-full w-full" aria-hidden>
          <rect width="20" height="14" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={(i * 14) / 13} width="20" height={14 / 13} fill="#B22234" />
          ))}
          <rect width="8.5" height={(7 * 14) / 13} fill="#3C3B6E" />
        </svg>
      )}
    </span>
  );
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    setLocale(next);
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 rounded-[7px] px-2 py-[7px] transition-colors',
          open ? 'bg-hover' : 'hover:bg-hover',
        )}
      >
        <LocaleFlag locale={locale} className="h-3.5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink">{locale}</span>
        <ChevronDown size={13} className={cn('text-faint transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-[60] mt-1.5 w-40 rounded-xl border border-card-border bg-white p-1 shadow-[var(--shadow-menu)]"
        >
          {LOCALES.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(l)}
                className={cn(
                  'flex h-9 w-full items-center gap-2 rounded-lg px-2 text-[13px] transition-colors',
                  active
                    ? 'bg-hover font-semibold text-ink'
                    : 'font-medium text-muted hover:bg-hover hover:text-ink',
                )}
              >
                <LocaleFlag locale={l} className="h-3.5 w-5" />
                <span className="flex-1 truncate text-left">{LOCALE_LABELS[l]}</span>
                {active ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
