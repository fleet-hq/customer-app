'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';
import { trackLead } from '@/lib/tracking-events';
import type { LeadPopupSection } from '@/services/companyContentServices';
import {
  LeadPopupRejected,
  submitLeadPopup,
  type LeadPopupErrors,
  type LeadPopupField,
  type LeadPopupResult,
} from '@/services/leadPopupServices';
import { readStoredLeadUtm, rememberLeadUtm, readPopupState, writePopupState, popupDue } from './lead-popup-state';

const HIDDEN_ON = ['/booking', '/bookings', '/manage', '/pay', '/rental-agreement', '/sign-in', '/register'];

const HEADING_FONTS: Record<NonNullable<LeadPopupSection['heading_font']>, string> = {
  poppins: 'var(--font-poppins)',
  manrope: 'var(--font-manrope)',
  inter: 'var(--font-inter)',
};

const PHONE_DIGITS = /^1?(\d{10})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function hiddenOn(pathname: string): boolean {
  return HIDDEN_ON.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function validate(values: Record<LeadPopupField, string>): LeadPopupErrors {
  const errors: LeadPopupErrors = {};
  if (!values.name.trim()) errors.name = 'Enter your full name.';
  if (!PHONE_DIGITS.test(values.phone.replace(/\D/g, ''))) errors.phone = 'Enter a 10-digit US phone number.';
  if (!EMAIL.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  return errors;
}

function SmallPrint({ text, privacyHref }: { text: string; privacyHref?: string }) {
  const marker = 'Privacy Policy';
  const at = text.indexOf(marker);
  if (!privacyHref || at < 0) return <Dyn>{text}</Dyn>;
  return (
    <>
      <Dyn>{text.slice(0, at)}</Dyn>
      <Link href={privacyHref} className="underline text-[var(--lp-accent)]">
        <Dyn>{marker}</Dyn>
      </Link>
      <Dyn>{text.slice(at + marker.length)}</Dyn>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}

export function LeadPopup({ config, domain }: { config: LeadPopupSection; domain?: string | null }) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<LeadPopupField, string>>({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<LeadPopupErrors>({});
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LeadPopupResult | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    rememberLeadUtm(window.location.search);
  }, []);

  useEffect(() => {
    if (open || hiddenOn(pathname) || !popupDue(readPopupState(), config.dismiss_days ?? 7)) return;
    for (const src of [config.image_url, config.logo_url]) {
      if (src) new window.Image().src = src;
    }
    const timer = window.setTimeout(() => setOpen(true), (config.delay_seconds ?? 3) * 1000);
    return () => window.clearTimeout(timer);
  }, [pathname, open, config.delay_seconds, config.dismiss_days, config.image_url, config.logo_url]);

  const close = useCallback(() => {
    setOpen(false);
    if (!result) writePopupState({ state: 'dismissed', at: Date.now() });
    returnFocusRef.current?.focus?.();
  }, [result]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button, input');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!open) return null;

  const set = (field: LeadPopupField) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFailed(false);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      const utm = readStoredLeadUtm();
      const lead = await submitLeadPopup(
        {
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          page_url: window.location.href,
          utm_source: utm.utm_source,
          utm_campaign: utm.utm_campaign,
        },
        domain,
      );
      writePopupState({ state: 'submitted', at: Date.now() });
      setResult(lead);
      trackLead('popup');
    } catch (err) {
      if (err instanceof LeadPopupRejected) setErrors(err.fields);
      else setFailed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const colors = config.colors ?? {};
  const style = {
    '--lp-surface': colors.surface || '#ffffff',
    '--lp-heading': colors.heading || 'var(--color-ink)',
    '--lp-body': colors.body || 'var(--color-label)',
    '--lp-accent': colors.accent || 'var(--color-primary)',
    '--lp-accent-text': colors.accent_text || '#ffffff',
    '--lp-border': colors.border || '#6b7280',
    '--lp-heading-font': HEADING_FONTS[config.heading_font ?? 'manrope'],
  } as React.CSSProperties;

  const headingFont = 'font-[family-name:var(--lp-heading-font)] font-semibold';
  const eyebrowClass = `${headingFont} m-0 mb-[8px] text-[10.5px] uppercase tracking-[0.2em] text-[var(--lp-accent)] sm:mb-[10px] sm:text-[11px]`;
  const headlineClass = `${headingFont} m-0 mb-[10px] text-[21px] leading-[1.2] tracking-[-0.02em] text-[var(--lp-heading)] sm:mb-[12px] sm:text-[25px]`;
  const bodyClass = 'm-0 text-[13px] leading-[1.45] text-[var(--lp-body)] sm:text-[13.5px] sm:leading-[1.5]';
  const pillClass = `${headingFont} inline-flex h-[44px] items-center justify-center rounded-full bg-[var(--lp-accent)] px-[26px] text-[14px] text-[var(--lp-accent-text)] no-underline disabled:opacity-60 sm:h-[42px]`;
  const inputClass =
    'h-[40px] w-full rounded-none border border-[var(--lp-border)] bg-[var(--lp-surface)] px-[12px] text-[16px] text-[var(--lp-heading)] outline-none focus:border-[var(--lp-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--lp-accent)_25%,transparent)] sm:h-[38px] sm:text-[14px]';

  const field = (key: LeadPopupField, label: string, type: string, placeholder: string, autoComplete: string) => (
    <label className="flex min-w-0 flex-col gap-[4px] text-[12px] font-medium text-[var(--lp-body)]">
      <Dyn>{label}</Dyn>
      <input
        ref={key === 'name' ? firstFieldRef : undefined}
        className={inputClass}
        type={type}
        value={values[key]}
        onChange={set(key)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `lead-popup-${key}-error` : undefined}
      />
      {errors[key] ? (
        <span id={`lead-popup-${key}-error`} className="text-[12px] font-normal text-[#b42318]">
          <Dyn>{errors[key]}</Dyn>
        </span>
      ) : null}
    </label>
  );

  const photo = (variant: 'side' | 'header') => (
    <div
      className={
        variant === 'side'
          ? 'relative hidden w-[300px] shrink-0 overflow-hidden bg-[#16181a] sm:block'
          : 'relative h-[112px] shrink-0 overflow-hidden bg-[#16181a] sm:hidden'
      }
    >
      {config.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.image_url}
          alt={config.image_alt ?? ''}
          className={`absolute inset-0 h-full w-full object-cover ${variant === 'side' ? 'object-[50%_40%]' : 'object-[50%_32%]'}`}
        />
      ) : null}
      <div
        className={`absolute inset-0 ${
          variant === 'side'
            ? 'bg-[linear-gradient(to_top,rgba(22,24,26,0.86)_0%,rgba(22,24,26,0.55)_38%,rgba(22,24,26,0.1)_70%,rgba(22,24,26,0.45)_100%)]'
            : 'bg-[linear-gradient(to_right,rgba(22,24,26,0.75)_0%,rgba(22,24,26,0.25)_60%,rgba(22,24,26,0.1)_100%)]'
        }`}
      />
      {config.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.logo_url}
          alt=""
          className={variant === 'side' ? 'absolute left-[24px] top-[24px] w-[84px]' : 'absolute left-[18px] top-[18px] w-[64px]'}
        />
      ) : null}
      {config.tagline ? (
        <p
          className={`${headingFont} absolute m-0 leading-[1.3] text-[#f6f8f9] ${
            variant === 'side' ? 'bottom-[24px] left-[24px] right-[24px] text-[17px]' : 'bottom-[12px] left-[18px] text-[12.5px]'
          }`}
        >
          <Dyn>{config.tagline}</Dyn>
        </p>
      ) : null}
      {variant === 'header' ? (
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-[6px] top-[6px] flex h-[44px] w-[44px] items-center justify-center text-[#f6f8f9]"
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );

  const headline = (config.success_headline || 'Thanks, {first_name}. Here is your code.').replace(
    '{first_name}',
    result?.first_name ?? '',
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto px-[12px] py-[16px]">
      <div className="fixed inset-0 bg-[rgba(22,24,26,0.62)]" onClick={close} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-popup-title"
        style={style}
        className="relative flex w-full max-w-[880px] flex-col bg-[var(--lp-surface)] font-[family-name:var(--font-inter)] shadow-[0_24px_60px_rgba(22,24,26,0.45)] sm:min-h-[560px] sm:flex-row"
      >
        {photo('side')}
        {photo('header')}
        <div className="relative flex flex-1 flex-col px-[18px] pb-[16px] pt-[18px] sm:px-[40px] sm:pb-[24px] sm:pt-[36px]">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-[14px] top-[14px] hidden h-[44px] w-[44px] items-center justify-center text-[var(--lp-body)] sm:flex"
          >
            <CloseIcon />
          </button>

          {result ? (
            <>
              <p className={eyebrowClass}>
                <Dyn>{config.success_eyebrow || 'You are in'}</Dyn>
              </p>
              <h2 id="lead-popup-title" className={headlineClass}>
                <Dyn>{headline}</Dyn>
              </h2>
              {config.success_body ? (
                <p className={`${bodyClass} mb-[14px] sm:mb-[18px]`}>
                  <Dyn>{config.success_body}</Dyn>
                </p>
              ) : null}
              <div className="mb-[14px] flex items-stretch border-2 border-dashed border-[var(--lp-accent)] sm:mb-[18px]">
                <span
                  className={`${headingFont} flex h-[48px] flex-1 items-center px-[14px] text-[20px] tracking-[0.12em] text-[var(--lp-heading)] sm:h-[52px] sm:px-[18px] sm:text-[24px]`}
                  data-testid="lead-popup-code"
                >
                  {result.code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="bg-[var(--lp-accent)] px-[16px] text-[13px] font-medium text-[var(--lp-accent-text)] sm:px-[20px]"
                >
                  <Dyn>{copied ? 'Copied' : config.copy_label || 'Copy code'}</Dyn>
                </button>
              </div>
              {config.success_followup ? (
                <p className={`${bodyClass} mb-[14px] sm:mb-[16px]`}>
                  <Dyn>{config.success_followup}</Dyn>
                </p>
              ) : null}
              <div className="flex flex-col items-stretch gap-[6px] sm:flex-row sm:items-center sm:gap-[20px]">
                <Link href={config.trip_form_href || paths.contact} className={pillClass} onClick={() => setOpen(false)}>
                  <Dyn>{config.trip_form_label || 'Complete my trip form'}</Dyn>
                </Link>
                <Link
                  href={paths.fleet}
                  className="self-center py-[10px] text-[13px] text-[var(--lp-body)] underline sm:py-0"
                  onClick={() => setOpen(false)}
                >
                  <Dyn>{config.fleet_label || 'Browse the fleet'}</Dyn>
                </Link>
              </div>
              {config.footer ? (
                <p className="m-0 mt-[8px] text-center text-[12px] leading-[1.5] text-[var(--lp-body)] sm:mt-auto sm:pt-[16px] sm:text-left">
                  <Dyn>{config.footer}</Dyn>
                </p>
              ) : null}
            </>
          ) : (
            <>
              {config.eyebrow ? (
                <p className={eyebrowClass}>
                  <Dyn>{config.eyebrow}</Dyn>
                </p>
              ) : null}
              <h2 id="lead-popup-title" className={headlineClass}>
                <Dyn>{config.headline || 'Get a code for your booking'}</Dyn>
              </h2>
              {config.body ? (
                <p className={`${bodyClass} mb-[14px] sm:mb-[18px]`}>
                  <Dyn>{config.body}</Dyn>
                </p>
              ) : null}
              <form onSubmit={onSubmit} noValidate className="m-0 flex flex-col gap-[8px] sm:gap-[10px]">
                {field('name', config.name_label || 'Full name', 'text', config.name_placeholder || '', 'name')}
                <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2 sm:gap-[10px]">
                  {field('phone', config.phone_label || 'Phone number', 'tel', config.phone_placeholder || '', 'tel')}
                  {field('email', config.email_label || 'Email address', 'email', config.email_placeholder || '', 'email')}
                </div>
                {config.prompt ? (
                  <p className="m-0 mt-[4px] text-[12.5px] font-medium text-[var(--lp-heading)] sm:mt-[6px] sm:text-[13px]">
                    <Dyn>{config.prompt}</Dyn>
                  </p>
                ) : null}
                {failed ? (
                  <p className="m-0 text-[12px] text-[#b42318]" role="alert">
                    <Dyn>Something went wrong. Please try again.</Dyn>
                  </p>
                ) : null}
                <div>
                  <button type="submit" disabled={submitting} className={`${pillClass} w-full sm:w-auto`}>
                    <Dyn>{submitting ? 'Sending…' : config.button_label || 'Get my code'}</Dyn>
                  </button>
                </div>
              </form>
              {config.small_print ? (
                <p className="m-0 mt-[12px] text-[11px] leading-[1.5] text-[var(--lp-body)] sm:mt-auto sm:pt-[16px]">
                  <SmallPrint text={config.small_print} privacyHref={config.privacy_href} />
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
