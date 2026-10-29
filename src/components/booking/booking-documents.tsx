'use client';

import { useMemo, useRef, useState } from 'react';
import { Dyn } from '@/components/i18n/Dyn';
import { useIsT2 } from '@/lib/use-is-t2';
import { cn } from '@/lib/utils';
import styles from '@/styles/template-2.module.css';
import {
  ACCEPTED_FILE_TYPES,
  DOCUMENT_TYPES_FOR_KIND,
  DOCUMENT_TYPE_LABELS,
  MAX_DOCUMENT_BYTES,
  deleteManualDocument,
  uploadManualVerification,
  type ManualDocumentType,
  type ManualVerificationKind,
  type ManualVerificationSubmission,
} from '@/services/manualVerificationServices';
import { extractApiErrorMessage } from '@/lib/api-errors';

const KIND_FOR_DOCUMENT = Object.fromEntries(
  Object.entries(DOCUMENT_TYPES_FOR_KIND).flatMap(([kind, types]) =>
    types.map((type) => [type, kind as ManualVerificationKind]),
  ),
) as Record<ManualDocumentType, ManualVerificationKind>;

const CHOICES = Object.keys(KIND_FOR_DOCUMENT) as ManualDocumentType[];

function sizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Documents the operator asked for, kept apart from verification.
 *
 * Uploading something here proves nothing on its own — identity and
 * insurance are settled by Stripe and Modives, and nobody reviews these
 * to decide either. They exist because an operator sometimes needs a
 * copy of something, and the renter needs somewhere to put it.
 *
 * That separation is the point: this used to sit inside the verification
 * cards as an alternative to those checks, so renters uploaded a photo
 * and waited for an approval that gated their booking.
 */
export function BookingDocuments({
  submissions,
  onUploaded,
}: {
  submissions: ManualVerificationSubmission[];
  onUploaded: () => void;
}) {
  const isT2 = useIsT2();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<ManualDocumentType>('licence');
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploaded = useMemo(
    () =>
      submissions
        .flatMap((s) => s.documents.map((d) => ({ ...d, submittedAt: s.createdAt })))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [submissions],
  );

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError('That file is too large. Please upload one under 10 MB.');
      return;
    }
    setUploading(true);
    try {
      await uploadManualVerification(KIND_FOR_DOCUMENT[documentType], [
        { file, documentType },
      ]);
      onUploaded();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'We could not upload that file. Please try again.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onRemove = async (documentId: number) => {
    setError(null);
    // Asked once before it goes: an upload the renter cannot get back
    // is worse than one extra click.
    if (confirmId !== documentId) {
      setConfirmId(documentId);
      return;
    }
    setRemovingId(documentId);
    try {
      await deleteManualDocument(documentId);
      onUploaded();
    } catch {
      setError('We could not remove that file. Please try again.');
    } finally {
      setRemovingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isT2 ? 'rounded-[var(--skin-radius,3px)] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
      )}
    >
      <h3 className={cn('text-[14px] font-semibold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
        <Dyn>Documents</Dyn>
      </h3>
      <p className={cn('mt-1 text-[12px] leading-[1.5]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
        <Dyn>
          Upload anything the rental company has asked you for. These are kept
          with your booking and do not replace ID or insurance verification.
        </Dyn>
      </p>

      {uploaded.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {uploaded.map((doc) => (
            <li
              key={doc.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-[8px] border px-3 py-2',
                isT2 ? 'border-[var(--line)]' : 'border-card-border',
              )}
            >
              <div className="min-w-0">
                <p className={cn('truncate text-[12.5px] font-medium', isT2 ? 'text-[var(--text)]' : 'text-ink')}>
                  {doc.originalName}
                </p>
                <p className={cn('text-[11px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
                  <Dyn>{DOCUMENT_TYPE_LABELS[doc.documentType]}</Dyn> · {sizeLabel(doc.sizeBytes)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'text-[12px] font-semibold',
                      isT2 ? 'text-[var(--brass)]' : 'text-secondary',
                    )}
                  >
                    <Dyn>View</Dyn>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(doc.id)}
                  disabled={removingId === doc.id}
                  className={cn(
                    'text-[12px] font-semibold disabled:opacity-50',
                    isT2 ? 'text-[var(--danger)]' : 'text-danger',
                  )}
                >
                  <Dyn>
                    {removingId === doc.id
                      ? 'Removing…'
                      : confirmId === doc.id
                        ? 'Confirm'
                        : 'Remove'}
                  </Dyn>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as ManualDocumentType)}
          aria-label="Document type"
          // selectInput already solves the native arrow sitting hard
          // against the right border — reuse it rather than redraw the
          // chevron here.
          className={cn(
            'text-[12.5px] sm:w-[190px]',
            isT2
              ? styles.selectInput
              : 'h-9 rounded-[8px] border border-card-border bg-white pl-2 pr-3 text-ink',
          )}
        >
          {CHOICES.map((type) => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          disabled={uploading}
          onChange={(e) => onPick(e.target.files?.[0])}
          className={cn(
            'flex-1 text-[12px] file:mr-3 file:rounded-[8px] file:border-0 file:px-3 file:py-2 file:text-[12px] file:font-semibold',
            isT2
              ? 'text-[var(--text-muted)] file:bg-[var(--ink)] file:text-[var(--on-ink)]'
              : 'text-muted file:bg-secondary file:text-white',
          )}
        />
      </div>

      {uploading && (
        <p className={cn('mt-2 text-[11.5px]', isT2 ? 'text-[var(--text-muted)]' : 'text-muted')}>
          <Dyn>Uploading…</Dyn>
        </p>
      )}
      {error && (
        <p className={cn('mt-2 text-[11.5px]', isT2 ? 'text-[var(--danger)]' : 'text-danger')}>
          <Dyn>{error}</Dyn>
        </p>
      )}
    </div>
  );
}
