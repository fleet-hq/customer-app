'use client';

import { useMemo, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Dyn } from '@/components/i18n/Dyn';
import { cn } from '@/lib/utils';
import { useTenant } from '@/lib/tenant-context';
import {
  ACCEPTED_FILE_TYPES,
  DOCUMENT_TYPES_FOR_KIND,
  DOCUMENT_TYPE_LABELS,
  MAX_DOCUMENT_BYTES,
  uploadManualVerification,
  type ManualDocumentType,
  type ManualVerificationKind,
} from '@/services/manualVerificationServices';

type Step = 'choose' | 'upload';

interface Props {
  open: boolean;
  onClose: () => void;
  kind: ManualVerificationKind;
  onUploaded: () => void;
  onAutomated: () => void;
  automatedLabel: string;
  automatedDescription: string;
  rejectionReason?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ManualVerificationModal({
  open,
  onClose,
  kind,
  onUploaded,
  onAutomated,
  automatedLabel,
  automatedDescription,
  rejectionReason,
}: Props) {
  const isT2 = useTenant().websiteTemplate === 'template_2';
  const [step, setStep] = useState<Step>('choose');
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const docTypes = DOCUMENT_TYPES_FOR_KIND[kind];
  const chosen = useMemo(
    () =>
      docTypes.flatMap((t) =>
        (files[t] ?? []).map((file) => ({ documentType: t, file })),
      ),
    [docTypes, files],
  );

  function reset() {
    setStep('choose');
    setFiles({});
    setError(null);
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  function add(documentType: ManualDocumentType, incoming: FileList | null) {
    setError(null);
    if (!incoming || incoming.length === 0) return;
    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      if (file.size > MAX_DOCUMENT_BYTES) {
        setError(`${file.name} is larger than 10MB.`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;
    setFiles((prev) => {
      const existing = prev[documentType] ?? [];
      const merged = [...existing];
      for (const file of accepted) {
        const duplicate = merged.some(
          (f) => f.name === file.name && f.size === file.size,
        );
        if (!duplicate) merged.push(file);
      }
      return { ...prev, [documentType]: merged };
    });
  }

  function removeAt(documentType: ManualDocumentType, index: number) {
    setError(null);
    setFiles((prev) => {
      const next = [...(prev[documentType] ?? [])];
      next.splice(index, 1);
      return { ...prev, [documentType]: next };
    });
  }

  async function submit() {
    if (chosen.length === 0) {
      setError('Add at least one document.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await uploadManualVerification(kind, chosen);
      reset();
      onUploaded();
    } catch (e: unknown) {
      const detail =
        (e as { response?: { data?: Record<string, string[] | string> } })?.response?.data;
      const firstKey = detail ? Object.keys(detail)[0] : null;
      const raw = firstKey ? detail?.[firstKey] : null;
      setError(
        (Array.isArray(raw) ? raw[0] : raw) ||
          'We could not upload your documents. Please try again.',
      );
      setSubmitting(false);
    }
  }

  const panel = isT2
    ? 'rounded-[3px] bg-[var(--card)] text-[var(--text)]'
    : 'rounded-xl bg-white text-ink';
  const cardBase = isT2
    ? 'rounded-[3px] border-[var(--line)] bg-[var(--paper)] hover:border-[var(--brass)]'
    : 'rounded-xl border-card-border bg-white hover:border-primary';
  const muted = isT2 ? 'text-[var(--text-muted)]' : 'text-muted';
  const heading = isT2 ? 'text-[var(--text)]' : 'text-secondary';
  const primaryBtn = isT2
    ? 'bg-[var(--ink)] text-[var(--on-ink)] hover:opacity-90'
    : 'bg-primary text-white hover:bg-primary-hover';
  const ghostBtn = isT2
    ? 'border border-[var(--line)] text-[var(--text)] hover:bg-[var(--paper)]'
    : 'border border-card-border text-secondary hover:bg-subtle';

  return (
    <Dialog
      isOpen={open}
      onClose={handleClose}
      labelledBy="manual-verification-title"
      panelClassName={cn('max-w-lg p-5 sm:p-6', panel)}
    >
      <h2 id="manual-verification-title" className={cn('text-[16px] font-semibold', heading)}>
        <Dyn>
          {kind === 'id' ? 'Verify your identity' : 'Verify your insurance'}
        </Dyn>
      </h2>

      {step === 'choose' ? (
        <>
          <p className={cn('mt-1 text-[12.5px] leading-[1.5]', muted)}>
            <Dyn>Choose how you would like to complete this check.</Dyn>
          </p>

          {rejectionReason ? (
            <div
              className={cn(
                'mt-3 rounded-lg border p-3 text-[12px] leading-[1.5]',
                isT2
                  ? 'border-[var(--line-strong)] bg-[var(--paper)] text-[var(--danger)]'
                  : 'border-danger-border bg-danger-bg text-danger-text',
              )}
            >
              <span className="font-semibold"><Dyn>Your last upload was not approved.</Dyn></span>{' '}
              <Dyn>{rejectionReason}</Dyn>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className={cn('border p-4 text-left transition-colors', cardBase)}
            >
              <p className={cn('text-[13px] font-semibold', heading)}>
                <Dyn>Upload documents</Dyn>
              </p>
              <p className={cn('mt-1.5 text-[11.5px] leading-[1.5]', muted)}>
                <Dyn>
                  {kind === 'id'
                    ? 'Send a photo of your licence and a selfie. Our team reviews them manually.'
                    : 'Send a copy of your insurance document. Our team reviews it manually.'}
                </Dyn>
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                handleClose();
                onAutomated();
              }}
              className={cn('border p-4 text-left transition-colors', cardBase)}
            >
              <p className={cn('text-[13px] font-semibold', heading)}>
                <Dyn>{automatedLabel}</Dyn>
              </p>
              <p className={cn('mt-1.5 text-[11.5px] leading-[1.5]', muted)}>
                <Dyn>{automatedDescription}</Dyn>
              </p>
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={cn('mt-1 text-[12.5px] leading-[1.5]', muted)}>
            <Dyn>Add clear photos or PDFs. You can attach more than one file per document. Maximum 10MB each.</Dyn>
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {docTypes.map((documentType) => {
              const picked = files[documentType] ?? [];
              return (
                <div
                  key={documentType}
                  className={cn(
                    'border p-3',
                    isT2 ? 'rounded-[3px] border-[var(--line)]' : 'rounded-lg border-card-border',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn('text-[12.5px] font-semibold', heading)}>
                        <Dyn>{DOCUMENT_TYPE_LABELS[documentType]}</Dyn>
                      </p>
                      <p className={cn('mt-0.5 text-[11px]', muted)}>
                        {picked.length === 0 ? (
                          <Dyn>No files selected</Dyn>
                        ) : (
                          `${picked.length} file${picked.length > 1 ? 's' : ''} selected`
                        )}
                      </p>
                    </div>
                    <input
                      ref={(el) => {
                        inputs.current[documentType] = el;
                      }}
                      type="file"
                      multiple
                      accept={ACCEPTED_FILE_TYPES}
                      className="hidden"
                      onChange={(e) => {
                        add(documentType, e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => inputs.current[documentType]?.click()}
                      className={cn(
                        'shrink-0 rounded-[9px] px-3 py-1.5 text-[11.5px] font-semibold disabled:opacity-60',
                        ghostBtn,
                      )}
                    >
                      <Dyn>{picked.length > 0 ? 'Add more' : 'Choose files'}</Dyn>
                    </button>
                  </div>

                  {picked.length > 0 ? (
                    <ul className="mt-2.5 flex flex-col gap-1.5">
                      {picked.map((file, index) => (
                        <li
                          key={`${file.name}-${file.size}-${index}`}
                          className={cn(
                            'flex items-center justify-between gap-2 px-2 py-1.5',
                            isT2
                              ? 'rounded-[3px] bg-[var(--paper)]'
                              : 'rounded-md bg-subtle',
                          )}
                        >
                          <span className={cn('min-w-0 truncate text-[11px]', muted)}>
                            {file.name} · {formatSize(file.size)}
                          </span>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => removeAt(documentType, index)}
                            aria-label={`Remove ${file.name}`}
                            className={cn(
                              'shrink-0 text-[11px] font-semibold disabled:opacity-60',
                              isT2 ? 'text-[var(--danger)]' : 'text-danger',
                            )}
                          >
                            <Dyn>Remove</Dyn>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>

          {error ? (
            <p className={cn('mt-3 text-[11.5px]', isT2 ? 'text-[var(--danger)]' : 'text-danger')}>
              <Dyn>{error}</Dyn>
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep('choose')}
              className={cn(
                'rounded-[9px] px-4 py-2.5 text-[12.5px] font-semibold disabled:opacity-60',
                ghostBtn,
              )}
            >
              <Dyn>Back</Dyn>
            </button>
            <button
              type="button"
              disabled={submitting || chosen.length === 0}
              onClick={submit}
              className={cn(
                'rounded-[9px] px-5 py-2.5 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-60',
                primaryBtn,
              )}
            >
              <Dyn>{submitting ? 'Uploading…' : 'Submit for review'}</Dyn>
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
