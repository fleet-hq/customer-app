'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { NmiPayments } from '@nmipayments/nmi-pay-react';

import { Dyn } from '@/components/i18n/Dyn';

/**
 * Always-visible NMI card entry.
 *
 * NMI's Payment Component renders its own secure fields and hands back
 * a token once they are complete, so card details never reach us. It
 * can submit on its own button, but this page already has a Reserve
 * button and one submit is less confusing than two — so the token is
 * captured from ``onChange`` as the renter finishes the fields, and
 * the parent reads it when they press Reserve.
 */

export interface NmiCardEntryHandle {
  /** The payment token, or null when the fields are not complete. */
  getToken(): string | null;
  /** True once the card fields are usable. */
  isReady(): boolean;
}

interface Props {
  tokenizationKey: string;
  onError?: (message: string | null) => void;
}

const NmiCardEntry = forwardRef<NmiCardEntryHandle, Props>(function NmiCardEntry(
  { tokenizationKey, onError },
  ref,
) {
  const tokenRef = useRef<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    getToken: () => (complete ? tokenRef.current : null),
    isReady: () => ready && !!tokenizationKey,
  }));

  if (!tokenizationKey) {
    return (
      <p className="text-sm text-red-600">
        <Dyn>
          This company has not finished setting up card payments. Please contact
          them to book.
        </Dyn>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <NmiPayments
        tokenizationKey={tokenizationKey}
        // Card only. The wallets want an amount passed up front, which
        // this page does not know until the renter has picked dates and
        // extras — and without one the component renders "Apple Pay
        // requires amount to be specified" and never finishes loading
        // the card fields at all.
        paymentMethods={['card']}
        onFieldsAvailable={() => setReady(true)}
        onChange={(event) => {
          // The token only arrives once every field validates, so
          // ``complete`` is the thing to gate the submit on — not the
          // presence of a token from an earlier keystroke.
          tokenRef.current = event?.token ?? null;
          setComplete(!!event?.complete);
          if (event?.complete) onError?.(null);
        }}
      />

    </div>
  );
});

export default NmiCardEntry;
