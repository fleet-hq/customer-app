'use client';

import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { Check, Close } from '@/components/ui/icons';
import { SignaturePad } from '@/components/ui/signature-pad';
import { useDefaultAgreementTemplate, useBonzahAddendum } from '@/hooks/useAgreements';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { useTenant } from '@/lib/tenant-context';
import styles from '@/styles/template-2.module.css';

interface RentalAgreementSignModalProps {
  open: boolean;
  onClose: () => void;
  onSigned: (signatureDataUri: string) => void;
  initialSignature?: string | null;
  showBonzahAddendum?: boolean;
}

const WITNESS_BODY =
  ', the renter has executed this Vehicle Rental Agreement. By signing below, the renter acknowledges having read, understood, and agreed to be bound by all terms and conditions contained herein.';

const STATIC = [
  'Terms & Conditions',
  'Signature and Date',
  'IN WITNESS WHEREOF',
  WITNESS_BODY,
  'I have read and agree to the',
  "Renter's Signature",
  'Cancel',
  'Sign & Accept',
  'Close',
  'This company has not published a rental agreement yet.',
  'Rental Agreement',
];

function Paper({ children, isT2 = false }: { children: React.ReactNode; isT2?: boolean }) {
  return (
    <article
      className={cn(
        'rounded-md px-5 sm:px-8 py-8',
        isT2
          ? 'rounded-[3px] border border-[var(--line)] bg-[var(--card)]'
          : 'bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.04)]',
      )}
    >
      {children}
    </article>
  );
}

function SectionTitle({
  children,
  className = '',
  isT2 = false,
}: {
  children: React.ReactNode;
  className?: string;
  isT2?: boolean;
}) {
  return (
    <h3
      className={cn(
        'font-manrope font-bold text-[12px] sm:text-[14px] leading-tight tracking-[-0.02em] text-center pb-4',
        isT2 ? 'text-[var(--text)]' : 'text-[#131314]',
        className,
      )}
    >
      {children}
    </h3>
  );
}

function Spinner({ isT2 = false }: { isT2?: boolean }) {
  return (
    <div className="flex items-center justify-center py-16">
      <span
        className={cn(
          'h-6 w-6 animate-spin rounded-full border-2',
          isT2 ? 'border-[var(--line)] border-t-[var(--brass)]' : 'border-line border-t-primary',
        )}
      />
    </div>
  );
}

export function RentalAgreementSignModal({
  open,
  onClose,
  onSigned,
  initialSignature = null,
  showBonzahAddendum = false,
}: RentalAgreementSignModalProps) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const { data: template, isLoading } = useDefaultAgreementTemplate();
  const { data: bonzahAddendum } = useBonzahAddendum();

  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState<string | null>(initialSignature);

  const clauses = useMemo(() => template?.clauses ?? [], [template]);
  const addendumSections = useMemo(
    () => (showBonzahAddendum && bonzahAddendum ? bonzahAddendum.sections : []),
    [showBonzahAddendum, bonzahAddendum],
  );
  const titleText = template?.title || 'Rental Agreement';

  const textInputs = useMemo(
    () => [
      ...STATIC,
      titleText,
      ...clauses.map((c) => c.title),
      ...(bonzahAddendum ? [bonzahAddendum.title] : []),
      ...addendumSections.flatMap((s) => [s.heading, s.body]),
    ],
    [titleText, clauses, bonzahAddendum, addendumSections],
  );
  const htmlInputs = useMemo(() => clauses.map((c) => c.content), [clauses]);

  const { t, ready: textReady } = useDynamicTranslation(textInputs);
  const { t: th, ready: htmlReady } = useDynamicTranslation(htmlInputs, { html: true });
  const contentReady = !isLoading && textReady && htmlReady;

  useEffect(() => {
    if (!open) return;
    setAgree(!!initialSignature);
    setSignature(initialSignature);
  }, [open, initialSignature]);

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
        className={cn(
          'flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl shadow-2xl',
          isT2 ? 'rounded-[3px] bg-[var(--card)] border border-[var(--line)]' : 'bg-white',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b px-6 py-4',
            isT2 ? 'border-[var(--line)]' : 'border-[#e2e8f0]',
          )}
        >
          <h2 className={cn('text-[16px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
            {contentReady ? t(titleText) : ''}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              isT2
                ? 'text-[var(--text-muted)] hover:bg-[var(--line)] hover:text-[var(--text)]'
                : 'text-faint hover:bg-[#f1f5f9] hover:text-ink',
            )}
          >
            <Close size={16} />
          </button>
        </div>

        <div
          className={cn(
            'flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-4',
            isT2 ? 'bg-[var(--paper)]' : 'bg-[#F5F7F9]',
          )}
        >
          {!contentReady ? (
            <Spinner isT2={isT2} />
          ) : clauses.length === 0 ? (
            <Paper isT2={isT2}>
              <p className={cn('py-10 text-center text-[13px]', isT2 ? 'text-[var(--text-muted)]' : 'text-faint')}>
                {t('This company has not published a rental agreement yet.')}
              </p>
            </Paper>
          ) : (
            <Paper isT2={isT2}>
              <SectionTitle isT2={isT2}>{t('Terms & Conditions')}</SectionTitle>
              <div className="mt-4 space-y-5">
                {clauses.map((c, i) => (
                  <div key={c.id} className="clause-block">
                    <h4
                      className={cn(
                        'font-bold text-[12px] tracking-[-0.02em] mb-2',
                        isT2 ? 'text-[var(--text)]' : 'text-[#131314]',
                      )}
                    >
                      {i + 1}. {t(c.title)}
                    </h4>
                    <div
                      className={cn(
                        'text-[12px] leading-[1.6] prose prose-sm max-w-none',
                        isT2 ? 'text-[var(--text-muted)]' : 'text-[#131314]',
                      )}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(th(c.content)) }}
                    />
                  </div>
                ))}
              </div>
            </Paper>
          )}

          {contentReady && showBonzahAddendum && bonzahAddendum && addendumSections.length > 0 && (
            <Paper isT2={isT2}>
              <SectionTitle isT2={isT2}>{t(bonzahAddendum.title)}</SectionTitle>
              <div className="mt-4 space-y-5">
                {addendumSections.map((sec, i) => (
                  <div key={i} className="clause-block">
                    <h4
                      className={cn(
                        'font-bold text-[12px] tracking-[-0.02em] mb-2',
                        isT2 ? 'text-[var(--text)]' : 'text-[#131314]',
                      )}
                    >
                      {i + 1}. {t(sec.heading)}
                    </h4>
                    <p className={cn('text-[12px] leading-[1.6]', isT2 ? 'text-[var(--text-muted)]' : 'text-[#131314]')}>
                      {t(sec.body)}
                    </p>
                  </div>
                ))}
              </div>
            </Paper>
          )}

          {contentReady && (
            <Paper isT2={isT2}>
              <SectionTitle isT2={isT2}>{t('Signature and Date')}</SectionTitle>
              <p className={cn('mt-3 text-[10px] sm:text-[12px] leading-[1.6]', isT2 ? 'text-[var(--text-muted)]' : 'text-[#131314]')}>
                <b className={cn('font-bold', isT2 && 'text-[var(--text)]')}>{t('IN WITNESS WHEREOF')}</b>
                {t(WITNESS_BODY)}
              </p>

              <label
                onClick={() => setAgree((a) => !a)}
                className="mt-5 flex cursor-pointer items-center gap-[10px] whitespace-nowrap"
              >
                <span
                  className={cn(
                    'inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                    isT2
                      ? agree
                        ? 'border-[var(--brass)] bg-[var(--brass)]'
                        : 'border-[var(--line-strong)] bg-[var(--card)]'
                      : agree
                        ? 'border-primary bg-primary'
                        : 'border-control bg-white',
                  )}
                >
                  {agree && <Check size={11} strokeWidth={3} className={isT2 ? 'text-[var(--on-brass)]' : 'text-white'} />}
                </span>
                <span className={cn('text-[12px]', isT2 ? 'text-[var(--text)]' : 'text-[#131314]')}>
                  {t('I have read and agree to the')}{' '}
                  <span className="font-semibold">{t(titleText)}</span>.
                </span>
              </label>

              <div className="mt-5">
                <p
                  className={cn(
                    'font-caveat text-[18px] leading-none tracking-tight mb-2',
                    isT2 ? 'text-[var(--text)]' : 'text-[#131314]',
                  )}
                >
                  {t("Renter's Signature")}
                </p>
                <SignaturePad
                  label=""
                  initialSignature={initialSignature}
                  onSignatureChange={setSignature}
                  height={160}
                />
              </div>
            </Paper>
          )}
        </div>

        <div
          className={cn(
            'flex items-center justify-end gap-2 border-t px-6 py-4',
            isT2 ? 'border-[var(--line)]' : 'border-[#e2e8f0]',
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className={
              isT2
                ? cn(styles.btn, styles.btnGhost, 'min-w-32.5 !py-2 !text-[13px] !font-medium')
                : 'min-w-32.5 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-center text-[13px] font-medium text-ink hover:bg-[#f1f5f9]'
            }
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'min-w-32.5 rounded-lg px-4 py-2 text-center text-[13px] font-semibold',
              isT2
                ? canSubmit
                  ? cn(styles.btn, styles.btnBrass, '!rounded-lg !py-2')
                  : 'cursor-not-allowed rounded-lg bg-[var(--line)] text-[var(--text-muted)]'
                : canSubmit
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-[#e2e8f0] text-faint',
            )}
          >
            {t('Sign & Accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
