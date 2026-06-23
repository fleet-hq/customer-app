'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { getStripePublishableKey } from '@/services/stripeServices';

const stripeCache = new Map<string, Promise<Stripe | null>>();

function getStripeInstance(publishableKey: string) {
  if (!stripeCache.has(publishableKey)) {
    stripeCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripeCache.get(publishableKey)!;
}

const STRIPE_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0f172a',
    colorBackground: '#ffffff',
    colorText: '#334155',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '6px',
  },
};

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initStripe() {
      try {
        const publishableKey = await getStripePublishableKey();
        if (!publishableKey) {
          setIsLoading(false);
          return;
        }
        setStripePromise(getStripeInstance(publishableKey));
      } catch {
        // Payment system unavailable; fall through to render children
        // without an <Elements> wrapper so the rest of the app still works.
      } finally {
        setIsLoading(false);
      }
    }

    initStripe();
  }, []);

  if (isLoading || !stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise} options={{ appearance: STRIPE_APPEARANCE }}>
      {children}
    </Elements>
  );
}
