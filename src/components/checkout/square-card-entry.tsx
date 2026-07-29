'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

/**
 * Always-visible Square card entry.
 *
 * Mounts the Square Web Payments SDK card element as soon as the
 * checkout page renders — no PendingBookingCheckout row required.
 * The parent calls ``tokenize()`` on submit to produce the source
 * token, at which point the parent creates the pending row and
 * posts to ``/api/payments/square/create-payment/``.
 *
 * When the fleet has a security deposit, the parent should pass
 * ``requiresDeposit`` so the consent checkbox renders — and call
 * ``tokenize({ withSaveCard: true })`` so a second single-use token
 * gets minted for Square's Cards on File.
 */

export interface SquareCardEntryHandle {
  /** Tokenize the currently-entered card. Returns `null` on invalid card
   *  (a user-visible error is set internally). */
  tokenize(opts?: { withSaveCard?: boolean }): Promise<
    { paymentSourceId: string; saveCardSourceId: string | null } | null
  >;
  /** Whether the user has ticked the deposit consent checkbox. */
  consentChecked(): boolean;
  /** True once the SDK's card element is attached and interactive. */
  isReady(): boolean;
}

interface Props {
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  requiresDeposit?: boolean;
  depositConsentCopy?: string;
  onError?: (message: string | null) => void;
}

const SQUARE_SDK_SANDBOX = 'https://sandbox.web.squarecdn.com/v1/square.js';
const SQUARE_SDK_PRODUCTION = 'https://web.squarecdn.com/v1/square.js';

let squareLoaderPromise: Promise<typeof window.Square | null> | null = null;
function loadSquareSdk(environment: 'sandbox' | 'production'): Promise<typeof window.Square | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Square) return Promise.resolve(window.Square);
  if (squareLoaderPromise) return squareLoaderPromise;
  squareLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = environment === 'production' ? SQUARE_SDK_PRODUCTION : SQUARE_SDK_SANDBOX;
    script.async = true;
    script.onload = () => resolve(window.Square ?? null);
    script.onerror = () => reject(new Error('Failed to load Square Web Payments SDK.'));
    document.head.appendChild(script);
  });
  return squareLoaderPromise;
}

export const SquareCardEntry = forwardRef<SquareCardEntryHandle, Props>(function SquareCardEntry(
  { applicationId, locationId, environment, requiresDeposit = false, depositConsentCopy, onError },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attached: any = null;

    (async () => {
      if (!applicationId || !locationId) {
        setInitError('Square merchant credentials are missing.');
        onError?.('Square merchant credentials are missing.');
        return;
      }
      try {
        const Square = await loadSquareSdk(environment);
        if (cancelled || !Square) return;
        const payments = Square.payments(applicationId, locationId);
        const card = await payments.card({
          style: {
            input: {
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontFamily: 'helvetica neue, sans-serif',
              fontSize: '15px',
              fontWeight: '500',
            },
            'input::placeholder': {
              color: '#94A3B8',
            },
            'input.is-focus': {
              color: '#0F172A',
            },
            '.input-container': {
              borderColor: '#E2E8F0',
              borderRadius: '10px',
            },
            '.input-container.is-focus': {
              borderColor: '#0F172A',
            },
            '.input-container.is-error': {
              borderColor: '#EF4444',
            },
            '.message-text': {
              color: '#64748B',
            },
            '.message-icon': {
              color: '#64748B',
            },
            '.message-text.is-error': {
              color: '#EF4444',
            },
            '.message-icon.is-error': {
              color: '#EF4444',
            },
          },
        });
        if (cancelled) {
          try { await card.destroy(); } catch { /* ignore */ }
          return;
        }
        await card.attach(containerRef.current!);
        cardRef.current = card;
        attached = card;
        setReady(true);
      } catch (e: any) {
        const msg = e?.message || 'Could not initialise Square card entry.';
        if (!cancelled) {
          setInitError(msg);
          onError?.(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      const c = attached;
      if (c) {
        try { c.destroy(); } catch { /* ignore */ }
      }
      cardRef.current = null;
    };
  }, [applicationId, locationId, environment, onError]);

  useImperativeHandle(
    ref,
    () => ({
      isReady: () => ready,
      consentChecked: () => consentChecked,
      tokenize: async (opts) => {
        if (!cardRef.current) {
          onError?.('Card element is not ready. Please wait a moment and try again.');
          return null;
        }
        const result = await cardRef.current.tokenize();
        if (result.status !== 'OK' || !result.token) {
          const msg =
            result.errors?.[0]?.message ||
            'Card details are invalid. Please double-check and try again.';
          onError?.(msg);
          return null;
        }
        let saveCardSourceId: string | null = null;
        if (opts?.withSaveCard) {
          const save = await cardRef.current.tokenize();
          if (save.status === 'OK' && save.token) {
            saveCardSourceId = save.token;
          }
        }
        return { paymentSourceId: result.token, saveCardSourceId };
      },
    }),
    [ready, consentChecked, onError],
  );

  return (
    <div className="w-full max-w-full sm:rounded-2xl sm:border sm:border-card-border sm:bg-white sm:p-5 sm:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex items-center justify-between gap-3 sm:mb-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary sm:inline-flex">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="6" width="20" height="13" rx="2.5" />
              <path d="M2 10.5h20" />
              <path d="M6 15.5h4" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium leading-tight text-ink sm:text-[15px] sm:font-semibold">Card details</div>
            <div className="hidden text-[11px] leading-tight text-muted sm:block">Charged when you complete your booking</div>
          </div>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1 text-[10.5px] text-muted sm:gap-1.5 sm:rounded-full sm:bg-subtle sm:px-2.5 sm:py-1 sm:font-medium">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="whitespace-nowrap">Secured by Square</span>
        </span>
      </div>

      <div className="relative w-full max-w-full">
        {!ready && !initError ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center gap-2 rounded-xl border border-dashed border-card-border/70 bg-white px-3.5 text-[12px] text-muted" style={{ minHeight: 54 }}>
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-muted/40" />
            Loading secure card entry…
          </div>
        ) : null}
        <div
          ref={containerRef}
          className={`w-full max-w-full transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`}
          style={{ minHeight: 54 }}
        />
      </div>

      {initError ? (
        <p className="mt-2 break-words text-[12.5px] text-red-600">{initError}</p>
      ) : null}

      <div className="mt-3 hidden items-start gap-1.5 text-[10.5px] leading-snug text-muted sm:flex">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-[1px] flex-shrink-0">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span>Your card details never touch our servers — tokenized directly with Square.</span>
      </div>

      {requiresDeposit && depositConsentCopy ? (
        <button
          type="button"
          onClick={() => setConsentChecked((v) => !v)}
          className={`mt-3 flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors sm:mt-4 sm:gap-3 ${
            consentChecked
              ? 'border-primary-border bg-primary-soft'
              : 'border-card-border bg-subtle hover:bg-subtle/60'
          }`}
        >
          <span
            className={`mt-[2px] inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${
              consentChecked ? 'border-primary bg-primary' : 'border-control bg-white'
            }`}
          >
            {consentChecked && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className="min-w-0 flex-1 break-words text-[11.5px] leading-[1.55] text-ink">
            <span className="mb-0.5 block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-primary">Deposit authorization</span>
            {depositConsentCopy}
          </span>
        </button>
      ) : null}
    </div>
  );
});

export function buildDepositConsentCopy(args: {
  tenantName?: string;
  amount: number;
  currency: string;
}): string {
  const tenant = (args.tenantName || 'the operator').trim();
  const currency = (args.currency || 'usd').toUpperCase();
  const amount = Math.round(args.amount);
  return (
    `I authorize ${tenant} to securely save my card and charge up to ` +
    `${currency} ${amount.toLocaleString()} within 7 days after my return ` +
    `for any damages, additional charges, or fees per the rental terms.`
  );
}

declare global {
  interface Window {
    Square?: any;
  }
}
