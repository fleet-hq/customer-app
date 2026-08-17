'use client';

import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { Check, Close } from '@/components/ui/icons';
import { SignaturePad } from '@/components/ui/signature-pad';
import { useDefaultAgreementTemplate, useBonzahAddendum } from '@/hooks/useAgreements';

interface RentalAgreementSignModalProps {
  open: boolean;
  onClose: () => void;
  onSigned: (signatureDataUri: string) => void;
  initialSignature?: string | null;
  showBonzahAddendum?: boolean;
}

function Paper({ children }: { children: React.ReactNode }) {
  return (
    <article className="bg-white rounded-md shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.04)] px-5 sm:px-8 py-8">
      {children}
    </article>
  );
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3
      className={`font-manrope font-bold text-[12px] sm:text-[14px] leading-tight tracking-[-0.02em] text-[#131314] text-center pb-4 ${className}`}
    >
      {children}
    </h3>
  );
}

export function RentalAgreementSignModal({
  open,
  onClose,
  onSigned,
  initialSignature = null,
  showBonzahAddendum = false,
}: RentalAgreementSignModalProps) {
  const { data: template, isLoading } = useDefaultAgreementTemplate();
  const { data: bonzahAddendum } = useBonzahAddendum();

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-ink">
            {template?.title || 'Rental Agreement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-faint hover:bg-[#f1f5f9] hover:text-ink"
          >
            <Close size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F5F7F9] px-4 py-5 sm:px-6 space-y-4">
          {isLoading ? (
            <p className="py-10 text-center text-[13px] text-faint">Loading agreement…</p>
          ) : clauses.length === 0 ? (
            <Paper>
              <p className="py-10 text-center text-[13px] text-faint">
                This company has not published a rental agreement yet.
              </p>
            </Paper>
          ) : (
            <Paper>
              <SectionTitle>Terms &amp; Conditions</SectionTitle>
              <div className="mt-4 space-y-5">
                {clauses.map((c, i) => (
                  <div key={c.id} className="clause-block">
                    <h4 className="font-bold text-[12px] tracking-[-0.02em] text-[#131314] mb-2">
                      {i + 1}. {c.title}
                    </h4>
                    <div
                      className="text-[12px] leading-[1.6] text-[#131314] prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.content) }}
                    />
                  </div>
                ))}
              </div>
            </Paper>
          )}

          {showBonzahAddendum && bonzahAddendum && bonzahAddendum.sections.length > 0 && (
            <Paper>
              <SectionTitle>{bonzahAddendum.title}</SectionTitle>
              <div className="mt-4 space-y-5">
                {bonzahAddendum.sections.map((sec, i) => (
                  <div key={i} className="clause-block">
                    <h4 className="font-bold text-[12px] tracking-[-0.02em] text-[#131314] mb-2">
                      {i + 1}. {sec.heading}
                    </h4>
                    <p className="text-[12px] leading-[1.6] text-[#131314]">{sec.body}</p>
                  </div>
                ))}
              </div>
            </Paper>
          )}

          <Paper>
            <SectionTitle>Signature and Date</SectionTitle>
            <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
              <b className="font-bold">IN WITNESS WHEREOF</b>, the renter has executed this Vehicle
              Rental Agreement. By signing below, the renter acknowledges having read, understood,
              and agreed to be bound by all terms and conditions contained herein.
            </p>

            <label
              onClick={() => setAgree((a) => !a)}
              className="mt-5 flex cursor-pointer items-center gap-[10px] whitespace-nowrap"
            >
              <span
                className={cn(
                  'inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                  agree ? 'border-primary bg-primary' : 'border-control bg-white',
                )}
              >
                {agree && <Check size={11} strokeWidth={3} className="text-white" />}
              </span>
              <span className="text-[12px] text-[#131314]">
                I have read and agree to the{' '}
                <span className="font-semibold">{template?.title || 'Rental Agreement'}</span>.
              </span>
            </label>

            <div className="mt-5">
              <p className="font-caveat text-[18px] leading-none tracking-tight text-[#131314] mb-2">
                Renter&apos;s Signature
              </p>
              <SignaturePad
                label=""
                initialSignature={initialSignature}
                onSignatureChange={setSignature}
                height={160}
              />
            </div>
          </Paper>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-w-32.5 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-center text-[13px] font-medium text-ink hover:bg-[#f1f5f9]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'min-w-32.5 rounded-lg px-4 py-2 text-center text-[13px] font-semibold',
              canSubmit
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-[#e2e8f0] text-faint',
            )}
          >
            Sign &amp; Accept
          </button>
        </div>
      </div>
    </div>
  );
}
