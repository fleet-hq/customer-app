'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe, type StripeElementsOptions } from '@stripe/stripe-js';

export type PaymentProviderSlug = 'stripe' | 'square';

interface EmbedPaymentPanelProps {
  provider: PaymentProviderSlug;
  clientSecret: string;
  publishableKey: string;
  stripeAccountId: string;
  /** UUID of the PendingBookingCheckout row this payment belongs to.
   *  Stripe surfaces it in metadata; Square posts it back with the
   *  tokenized card so the backend can pair source_id ↔ pending row. */
  pendingId: string;
  returnUrl: string;
  amount: string;
  currency: string;
  onCancel: () => void;
  onSuccess?: () => void;
  /** Extra provider-specific credentials from the backend's
   *  start-embed-payment response. Currently unused by the Stripe
   *  path; Square uses `location_id` + `environment` to init the
   *  Web Payments SDK. */
  providerExtra?: Record<string, string | number | boolean | null>;
  /** Fleet security deposit amount (in the same currency as amount).
   *  When > 0 on the Square path, the SDK tokenizes the buyer's card
   *  twice — one token for the booking payment, a second attached to
   *  Cards on File so the operator can charge for damage during the
   *  claim window. Stripe uses SetupIntent automatically post-payment
   *  and ignores this. */
  depositAmount?: number;
  /** Tenant display name — interpolated into the deposit-consent copy
   *  the renter authorizes ("I authorize <tenant> to charge..."). */
  tenantName?: string;
}

const APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0f172a',
    colorText: '#0f172a',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '8px',
  },
};

/**
 * Provider-neutral payment panel. Dispatches on ``provider`` to the
 * correct SDK. New payment providers plug in here without any caller
 * changes — everything above this component only knows about the
 * dataclass-shaped props.
 */
export function EmbedPaymentPanel(props: EmbedPaymentPanelProps) {
  if (props.provider === 'square') {
    return <SquarePanel {...props} />;
  }
  return <StripePanel {...props} />;
}

// ─────────────────────────────────────────────────────────────────
// Stripe implementation
// ─────────────────────────────────────────────────────────────────

const stripeCache = new Map<string, Promise<Stripe | null>>();

function getStripe(publishableKey: string, connectedAccount: string) {
  const key = `${publishableKey}::${connectedAccount}`;
  if (!stripeCache.has(key)) {
    stripeCache.set(
      key,
      loadStripe(publishableKey, connectedAccount ? { stripeAccount: connectedAccount } : undefined),
    );
  }
  return stripeCache.get(key)!;
}

function StripePanel(props: EmbedPaymentPanelProps) {
  const stripePromise = useMemo(
    () => getStripe(props.publishableKey, props.stripeAccountId),
    [props.publishableKey, props.stripeAccountId],
  );

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret: props.clientSecret,
      appearance: APPEARANCE,
    }),
    [props.clientSecret],
  );

  return (
    <PaymentPanelShell amount={props.amount} currency={props.currency}>
      <Elements stripe={stripePromise} options={options}>
        <StripeConfirmForm
          returnUrl={props.returnUrl}
          amount={props.amount}
          currency={props.currency}
          onCancel={props.onCancel}
          onSuccess={props.onSuccess}
        />
      </Elements>
    </PaymentPanelShell>
  );
}

function StripeConfirmForm({
  returnUrl,
  amount,
  currency,
  onCancel,
  onSuccess,
}: {
  returnUrl: string;
  amount: string;
  currency: string;
  onCancel: () => void;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!elements) return;
    const el = elements.getElement('payment');
    if (!el) return;
    el.on('ready', () => setReady(true));
  }, [elements]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });
    if (result.error) {
      setError(result.error.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }
    if (result.paymentIntent?.status === 'succeeded') {
      onSuccess?.();
      return;
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error ? <p className="text-13 text-red-600">{error}</p> : null}
      <ActionRow
        amount={amount}
        currency={currency}
        onCancel={onCancel}
        submitting={submitting}
        disabled={!stripe || !elements || !ready || submitting}
      />
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// Square implementation (Web Payments SDK)
// ─────────────────────────────────────────────────────────────────

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

function SquarePanel(props: EmbedPaymentPanelProps) {
  const applicationId = props.publishableKey || '';
  const locationId = String(props.providerExtra?.location_id ?? '');
  const environment = (props.providerExtra?.environment as 'sandbox' | 'production') || 'sandbox';

  const depositAmount = props.depositAmount ?? 0;
  const requiresConsent = depositAmount > 0;
  const consentCopy = buildDepositConsentCopy({
    tenantName: props.tenantName,
    amount: depositAmount,
    currency: props.currency,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attached: any = null;

    (async () => {
      if (!applicationId || !locationId) {
        setError('Square merchant credentials are missing.');
        return;
      }
      try {
        const Square = await loadSquareSdk(environment);
        if (cancelled || !Square) return;
        const payments = Square.payments(applicationId, locationId);
        const card = await payments.card();
        if (cancelled) {
          try { await card.destroy(); } catch { /* ignore */ }
          return;
        }
        await card.attach(containerRef.current!);
        cardRef.current = card;
        attached = card;
        setReady(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not initialise Square card entry.');
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
  }, [applicationId, locationId, environment]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cardRef.current) return;
    if (requiresConsent && !consentChecked) {
      setError('Please authorize the deposit hold to continue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        const message =
          tokenResult.errors?.[0]?.message ||
          'Card details are invalid. Please double-check and try again.';
        setError(message);
        setSubmitting(false);
        return;
      }

      // When the fleet has a security deposit, tokenize the same card
      // a second time and hand both tokens to the backend. Square's
      // source tokens are single-use — one for CreatePayment, one for
      // CreateCard (Cards on File) so the operator can charge for
      // damage during the claim window without the customer present.
      let saveCardSourceId: string | null = null;
      if ((props.depositAmount ?? 0) > 0) {
        const saveTokenResult = await cardRef.current.tokenize();
        if (saveTokenResult.status === 'OK' && saveTokenResult.token) {
          saveCardSourceId = saveTokenResult.token;
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/square/create-payment/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: tokenResult.token,
          amount: props.amount,
          currency: props.currency,
          return_url: props.returnUrl,
          pending_id: props.pendingId,
          ...(saveCardSourceId
            ? {
                save_card_source_id: saveCardSourceId,
                consent_ack: true,
                consent_copy: consentCopy,
                consent_at: new Date().toISOString(),
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail || body.error || 'Square payment failed. Please try again.');
        setSubmitting(false);
        return;
      }
      props.onSuccess?.();
    } catch (e: any) {
      setError(e?.message || 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <PaymentPanelShell amount={props.amount} currency={props.currency}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div
          ref={containerRef}
          className="min-h-[90px] rounded-md border border-[#e2e8f0] bg-white p-3"
        />
        {requiresConsent ? (
          <DepositConsent
            copy={consentCopy}
            checked={consentChecked}
            onChange={setConsentChecked}
          />
        ) : null}
        {error ? <p className="text-13 text-red-600">{error}</p> : null}
        <ActionRow
          amount={props.amount}
          currency={props.currency}
          onCancel={props.onCancel}
          submitting={submitting}
          disabled={!ready || submitting || (requiresConsent && !consentChecked)}
        />
      </form>
    </PaymentPanelShell>
  );
}

function buildDepositConsentCopy(args: {
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

function DepositConsent({
  copy,
  checked,
  onChange,
}: {
  copy: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="mt-[13px] flex cursor-pointer items-center gap-[10px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${
          checked ? 'border-primary bg-primary' : 'border-control bg-white'
        }`}
      >
        {checked && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className="text-[11.5px] leading-[1.5] text-muted">{copy}</span>
    </label>
  );
}

declare global {
  interface Window {
    Square?: any;
  }
}

// ─────────────────────────────────────────────────────────────────
// Shared chrome
// ─────────────────────────────────────────────────────────────────

function PaymentPanelShell({
  amount,
  currency,
  children,
}: {
  amount: string;
  currency: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[15px] font-semibold text-ink">Card details</h3>
        <span className="text-[12px] text-muted">Total {formatMoney(amount, currency)}</span>
      </div>
      {children}
    </div>
  );
}

function ActionRow({
  amount,
  currency,
  onCancel,
  submitting,
  disabled,
}: {
  amount: string;
  currency: string;
  onCancel: () => void;
  submitting: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="text-[13px] font-medium text-muted hover:text-ink disabled:opacity-60"
      >
        Use a different payment
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-[10px] bg-primary px-5 py-[10px] text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Processing…' : `Pay ${formatMoney(amount, currency)}`}
      </button>
    </div>
  );
}

function formatMoney(amount: string, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency.toUpperCase()} ${amount}`;
  }
}
