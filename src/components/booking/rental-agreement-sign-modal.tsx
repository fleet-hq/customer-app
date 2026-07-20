'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Close } from '@/components/ui/icons';
import { SignaturePad } from '@/components/ui/signature-pad';
import { useDefaultAgreementTemplate } from '@/hooks/useAgreements';

interface RentalAgreementSignModalProps {
  open: boolean;
  onClose: () => void;
  onSigned: (signatureDataUri: string) => void;
  /** Optional initial signature — reopens with the previously drawn one visible. */
  initialSignature?: string | null;
}

export function RentalAgreementSignModal({
  open,
  onClose,
  onSigned,
  initialSignature = null,
}: RentalAgreementSignModalProps) {
  const { data: template, isLoading } = useDefaultAgreementTemplate();

  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState<string | null>(initialSignature);

  useEffect(() => {
    if (!open) return;
    setAgree(!!initialSignature);
    setSignature(initialSignature);
  }, [open, initialSignature]);

  const clauses = useMemo(() => template?.clauses ?? [], [template]);
  const canSubmit = !!signature && agree;

  const handleSubmit = () => {
    if (!canSubmit || !signature) return;
    onSigned(signature);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rental Agreement"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(12,14,16,0.6)] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_20px_60px_-16px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">
              {template?.title || 'Rental Agreement'}
            </h2>
            {template?.description && (
              <p className="mt-1 text-[12.5px] font-light text-faint">{template.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rental agreement"
            className="flex h-8 w-8 items-center justify-center rounded-full text-faint hover:bg-subtle hover:text-ink"
          >
            <Close size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="py-10 text-center text-[13px] text-faint">Loading agreement…</p>
          ) : clauses.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-faint">
              This company has not published a rental agreement yet.
            </p>
          ) : (
            <div className="space-y-5">
              {clauses.map((c, i) => (
                <section key={c.id} className="border-b border-hairline pb-4 last:border-b-0">
                  <h3 className="text-[13.5px] font-semibold text-ink">
                    {i + 1}. {c.title}
                  </h3>
                  <div
                    className="mt-2 whitespace-pre-line text-[12.5px] leading-[1.7] text-label"
                    dangerouslySetInnerHTML={{ __html: c.content }}
                  />
                </section>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-[10px] border border-hairline bg-subtle/40 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-faint">
              Signature
            </p>
            <p className="mt-1 text-[12px] leading-[1.55] text-faint">
              Draw your signature below to accept this rental agreement. Your signature will be
              attached to the booking once payment succeeds.
            </p>
            <div className="mt-3">
              <SignaturePad onSignatureChange={setSignature} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <label
            onClick={() => setAgree((a) => !a)}
            className="flex max-w-[440px] cursor-pointer items-start gap-[10px]"
          >
            <span
              className={cn(
                'mt-px inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                agree ? 'border-primary bg-primary' : 'border-control bg-white',
              )}
            >
              {agree && <Check size={11} strokeWidth={3} className="text-white" />}
            </span>
            <span className="text-[12px] leading-[1.55] text-label">
              I have read and agree to the{' '}
              <span className="font-semibold text-ink">
                {template?.title || 'Rental Agreement'}
              </span>
              , including the insurance, fuel, mileage and cancellation provisions.
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[9px] border border-line px-5 py-[9px] text-sm font-medium text-ink hover:bg-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'rounded-[9px] px-6 py-[9px] text-sm font-semibold text-white',
                canSubmit ? 'bg-primary hover:bg-primary-hover' : 'cursor-not-allowed bg-primary-disabled',
              )}
            >
              Sign &amp; Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
