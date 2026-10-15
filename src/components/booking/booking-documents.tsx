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
  uploadManualVerification,
  type ManualDocumentType,
  type ManualVerificationKind,
  type ManualVerificationSubmission,
} from '@/services/manualVerificationServices';

const KIND_FOR_DOCUMENT: Record<ManualDocumentType, ManualVerificationKind> = {
  licence: 'id',
  selfie: 'id',
  insurance_document: 'insurance',
};

const CHOICES: ManualDocumentType[] = [
  ...DOCUMENT_TYPES_FOR_KIND.id,
  ...DOCUMENT_TYPES_FOR_KIND.insurance,
];

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
    } catch {
      setError('We could not upload that file. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isT2 ? 'rounded-[3px] border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
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
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'shrink-0 text-[12px] font-semibold',
                    isT2 ? 'text-[var(--brass)]' : 'text-secondary',
                  )}
                >
                  <Dyn>View</Dyn>
                </a>
              )}
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
