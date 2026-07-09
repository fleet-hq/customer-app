'use client';

import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe, type StripeElementsOptions } from '@stripe/stripe-js';

interface EmbedPaymentPanelProps {
  clientSecret: string;
  publishableKey: string;
  stripeAccountId: string;
  returnUrl: string;
  amount: string;
  currency: string;
  onCancel: () => void;
  onSuccess?: () => void;
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

export function EmbedPaymentPanel(props: EmbedPaymentPanelProps) {
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
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-16 font-semibold text-ink">Card details</h3>
        <span className="text-14 text-muted">
          Total: {formatMoney(props.amount, props.currency)}
        </span>
      </div>
      <Elements stripe={stripePromise} options={options}>
        <ConfirmForm returnUrl={props.returnUrl} onCancel={props.onCancel} onSuccess={props.onSuccess} />
      </Elements>
    </div>
  );
}

function ConfirmForm({
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
          disabled={!stripe || !elements || !ready || submitting}
          className="rounded-[10px] bg-primary px-6 py-3 text-14 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Processing…' : 'Pay now'}
        </button>
      </div>
    </form>
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
