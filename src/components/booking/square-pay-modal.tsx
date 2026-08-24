'use client';

import { useEffect, useRef, useState } from 'react';
import {
  SquareCardEntry,
  buildDepositConsentCopy,
  type SquareCardEntryHandle,
} from '@/components/checkout/square-card-entry';

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  amount: number;
  currency: string;
  deposit: number;
  tenantName?: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (args: {
    paymentSourceId: string;
    saveCardSourceId: string | null;
    consentCopy: string;
  }) => void;
}

export function SquarePayModal({
  open,
  onClose,
  applicationId,
  locationId,
  environment,
  amount,
  currency,
  deposit,
  tenantName,
  submitting,
  error,
  onSubmit,
}: Props) {
  const cardRef = useRef<SquareCardEntryHandle | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  const currencyLabel = (currency || 'usd').toUpperCase();
  const requiresDeposit = deposit > 0;
  const consentCopy = requiresDeposit
    ? buildDepositConsentCopy({
        tenantName,
        amount: deposit,
        currency,
      })
    : '';

  const handlePayClick = async () => {
    if (submitting) return;
    setCardError(null);
    if (!cardRef.current || !cardRef.current.isReady()) {
      setCardError('Card entry is still loading — please wait a moment.');
      return;
    }
    if (requiresDeposit && !cardRef.current.consentChecked()) {
      setCardError('Please agree to the security deposit to continue.');
      return;
    }
    const tokens = await cardRef.current.tokenize({ withSaveCard: requiresDeposit });
    if (!tokens) return;
    onSubmit({
      paymentSourceId: tokens.paymentSourceId,
      saveCardSourceId: tokens.saveCardSourceId,
      consentCopy,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Pay to confirm booking</h3>
            <p className="mt-0.5 text-[12px] text-muted">
              {currencyLabel} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} charged now
              {requiresDeposit ? ` · plus a refundable ${currencyLabel} ${deposit.toLocaleString()} deposit` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-subtle disabled:opacity-40"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          <SquareCardEntry
            ref={cardRef}
            applicationId={applicationId}
            locationId={locationId}
            environment={environment}
            requiresDeposit={requiresDeposit}
            depositConsentCopy={requiresDeposit ? consentCopy : undefined}
            onError={setCardError}
          />

          {(cardError || error) && (
            <p className="mt-3 break-words text-[12.5px] text-red-600">
              {cardError || error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-card-border px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="rounded-xl border border-card-border bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-subtle disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePayClick}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {submitting ? 'Processing…' : `Pay ${currencyLabel} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </button>
        </div>
      </div>
    </div>
  );
}
