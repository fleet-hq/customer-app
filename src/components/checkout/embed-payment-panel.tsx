'use client';

import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe, type StripeElementsOptions } from '@stripe/stripe-js';

export type PaymentProviderSlug = 'stripe' | 'square';

interface EmbedPaymentPanelProps {
  provider: PaymentProviderSlug;
  clientSecret: string;
  publishableKey: string;
  stripeAccountId: string;
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
          onCancel={props.onCancel}
          onSuccess={props.onSuccess}
        />
      </Elements>
    </PaymentPanelShell>
  );
}

function StripeConfirmForm({
  returnUrl,
  onCancel,
  onSuccess,
}: {
  returnUrl: string;
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
        onCancel={onCancel}
        submitting={submitting}
        disabled={!stripe || !elements || !ready || submitting}
      />
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// Square implementation (Phase 1b will wire the Web Payments SDK)
// ─────────────────────────────────────────────────────────────────

function SquarePanel(props: EmbedPaymentPanelProps) {
  // Phase 1b will load Web Payments SDK from web.squarecdn.com and
  // mount Square.payments(applicationId, locationId).card() here, then
  // call POST /api/payments/square/create-payment/ with the tokenized
  // source_id on submit. For now the panel renders a placeholder so
  // Square tenants get a clear "coming soon" state rather than a
  // white screen.
  const applicationId = props.publishableKey || '';
  const locationId = String(props.providerExtra?.location_id ?? '');

  return (
    <PaymentPanelShell amount={props.amount} currency={props.currency}>
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-13 text-muted">
          Square checkout is being connected. Please contact support to complete this booking, or check
          back once the merchant has finished onboarding.
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-3 text-11">
              app_id: <code>{applicationId || '—'}</code> · location_id:{' '}
              <code>{locationId || '—'}</code>
            </div>
          )}
        </div>
        <ActionRow onCancel={props.onCancel} submitting={false} disabled />
      </div>
    </PaymentPanelShell>
  );
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
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-16 font-semibold text-ink">Card details</h3>
        <span className="text-14 text-muted">Total: {formatMoney(amount, currency)}</span>
      </div>
      {children}
    </div>
  );
}

function ActionRow({
  onCancel,
  submitting,
  disabled,
}: {
  onCancel: () => void;
  submitting: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="rounded-[10px] border border-[#e2e8f0] bg-white px-5 py-3 text-14 font-medium text-ink disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-[10px] bg-primary px-6 py-3 text-14 font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Processing…' : 'Pay now'}
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
