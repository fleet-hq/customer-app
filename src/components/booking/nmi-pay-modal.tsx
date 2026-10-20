'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import type { NmiCardEntryHandle } from '@/components/checkout/nmi-card-entry';
import { Dyn } from '@/components/i18n/Dyn';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { cn } from '@/lib/utils';
import { useTenant } from '@/lib/tenant-context';
import styles from '@/styles/template-2.module.css';

const NmiCardEntry = dynamic(() => import('@/components/checkout/nmi-card-entry'), { ssr: false });

/**
 * The payment window for NMI.
 *
 * NMI has no hosted checkout page we can send a renter to — its REST
 * API mints no checkout session and its invoices carry no payable URL
 * — so the card form opens over the booking page instead of alongside
 * it. Same shape as the Square modal, so a renter meets one payment
 * experience whichever gateway the operator uses.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  tokenizationKey: string;
  amount: number;
  currency: string;
  deposit: number;
  submitting: boolean;
  error: string | null;
  onSubmit: (args: { paymentToken: string }) => void;
}

export function NmiPayModal({
  open,
  onClose,
  tokenizationKey,
  amount,
  currency,
  deposit,
  submitting,
  error,
  onSubmit,
}: Props) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate !== 'template_1';
  const cardRef = useRef<NmiCardEntryHandle | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const { t } = useDynamicTranslation(['Close']);

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
  const money = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handlePayClick = () => {
    if (submitting) return;
    setCardError(null);
    if (!cardRef.current?.isReady()) {
      setCardError('The card form is still loading. Give it a moment and try again.');
      return;
    }
    const token = cardRef.current.getToken();
    if (!token) {
      setCardError('Please finish entering your card details.');
      return;
    }
    onSubmit({ paymentToken: token });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className={cn(
          'w-full max-w-2xl rounded-t-2xl shadow-2xl sm:rounded-2xl',
          isT2 ? 'sm:rounded-[var(--skin-radius,3px)] bg-[var(--card)] border border-[var(--line)]' : 'bg-white',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b px-5 py-4',
            isT2 ? 'border-[var(--line)]' : 'border-card-border',
          )}
        >
          <div>
            <h3
              className={cn(
                'text-[15px] font-semibold',
                isT2 ? 'text-[var(--text)]' : 'text-ink',
              )}
            >
              <Dyn>Pay to confirm booking</Dyn>
            </h3>
            <p
              className={cn(
                'mt-0.5 text-[12px]',
                isT2 ? 'text-[var(--text-muted)]' : 'text-muted',
              )}
            >
              {currencyLabel} {money(amount)} <Dyn>charged now</Dyn>
              {deposit > 0
                ? ` · plus a refundable ${currencyLabel} ${money(deposit)} deposit`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className={cn(
              'rounded-full p-1.5 transition-colors disabled:opacity-40',
              isT2
                ? 'text-[var(--text-muted)] hover:bg-[var(--line)]'
                : 'text-muted hover:bg-subtle',
            )}
            aria-label={t('Close')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          <NmiCardEntry
            ref={cardRef}
            tokenizationKey={tokenizationKey}
            onError={setCardError}
          />

          {(cardError || error) && (
            <p
              className={cn(
                'mt-3 break-words text-[12.5px]',
                isT2 ? 'text-[var(--danger)]' : 'text-red-600',
              )}
            >
              {cardError || error}
            </p>
          )}
        </div>

        <div
          className={cn(
            'flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end',
            isT2 ? 'border-[var(--line)]' : 'border-card-border',
          )}
        >
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className={
              isT2
                ? cn(styles.btn, styles.btnGhost, '!rounded-xl !py-2.5 !text-[13px] !font-medium disabled:opacity-40')
                : 'rounded-xl border border-card-border bg-white px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-subtle disabled:opacity-40'
            }
          >
            <Dyn>Cancel</Dyn>
          </button>
          <button
            type="button"
            onClick={handlePayClick}
            disabled={submitting}
            className={
              isT2
                ? cn(styles.btn, styles.btnBrass, '!rounded-xl !py-2.5 !text-[13px] !font-semibold disabled:opacity-60')
                : 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60'
            }
          >
            {submitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            <Dyn>
              {submitting
                ? 'Processing…'
                : `Pay ${currencyLabel} ${money(amount)}`}
            </Dyn>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NmiPayModal;
