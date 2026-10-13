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
  /** Whether the renter has ticked the save-card consent box. */
  consentChecked(): boolean;
  /** True once the card fields are usable. */
  isReady(): boolean;
}

interface Props {
  tokenizationKey: string;
  /** Show the authorization tickbox — the fleet takes a deposit or the
   *  operator keeps a card for incidentals. */
  requiresConsent?: boolean;
  consentCopy?: string;
  onError?: (message: string | null) => void;
}

const NmiCardEntry = forwardRef<NmiCardEntryHandle, Props>(function NmiCardEntry(
  { tokenizationKey, requiresConsent = false, consentCopy, onError },
  ref,
) {
  const tokenRef = useRef<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);

  useImperativeHandle(ref, () => ({
    getToken: () => (complete ? tokenRef.current : null),
    consentChecked: () => consent,
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

      {requiresConsent && (
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            <Dyn>{consentCopy || 'I authorize this card to be kept on file.'}</Dyn>
          </span>
        </label>
      )}
    </div>
  );
});

export default NmiCardEntry;
