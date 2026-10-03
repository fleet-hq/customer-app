import axios from 'axios';
import { getBookingTokenAuthHeaders, getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ManualVerificationKind = 'id' | 'insurance';
export type ManualVerificationStatus = 'pending_review' | 'approved' | 'rejected';
export type ManualDocumentType = 'licence' | 'insurance_document' | 'selfie';

export interface ManualVerificationDocument {
  id: number;
  documentType: ManualDocumentType;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  fileUrl: string | null;
  createdAt: string;
}

export interface ManualVerificationSubmission {
  id: number;
  kind: ManualVerificationKind;
  status: ManualVerificationStatus;
  rejectionReason: string;
  reviewedAt: string | null;
  reviewedByName: string;
  createdAt: string;
  documents: ManualVerificationDocument[];
}

export const DOCUMENT_TYPES_FOR_KIND: Record<ManualVerificationKind, ManualDocumentType[]> = {
  id: ['licence', 'selfie'],
  insurance: ['insurance_document'],
};

export const DOCUMENT_TYPE_LABELS: Record<ManualDocumentType, string> = {
  licence: "Driver's licence",
  insurance_document: 'Insurance document',
  selfie: 'Selfie or ID photo',
};

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = 'image/jpeg,image/png,image/webp,image/heic,application/pdf';

function mapSubmission(raw: Record<string, unknown>): ManualVerificationSubmission {
  const documents = Array.isArray(raw.documents) ? raw.documents : [];
  return {
    id: Number(raw.id),
    kind: raw.kind as ManualVerificationKind,
    status: raw.status as ManualVerificationStatus,
    rejectionReason: typeof raw.rejection_reason === 'string' ? raw.rejection_reason : '',
    reviewedAt: (raw.reviewed_at as string) ?? null,
    reviewedByName: typeof raw.reviewed_by_name === 'string' ? raw.reviewed_by_name : '',
    createdAt: (raw.created_at as string) ?? '',
    documents: documents.map((d) => {
      const doc = d as Record<string, unknown>;
      return {
        id: Number(doc.id),
        documentType: doc.document_type as ManualDocumentType,
        originalName: typeof doc.original_name === 'string' ? doc.original_name : '',
        contentType: typeof doc.content_type === 'string' ? doc.content_type : '',
        sizeBytes: Number(doc.size_bytes) || 0,
        fileUrl: (doc.file_url as string) ?? null,
        createdAt: (doc.created_at as string) ?? '',
      };
    }),
  };
}

export async function getManualVerifications(): Promise<ManualVerificationSubmission[]> {
  try {
    const res = await axios.get<Record<string, unknown>[]>(
      `${API_URL}/api/manual-verification/customer/`,
      { headers: getBookingTokenHeaders() },
    );
    return Array.isArray(res.data) ? res.data.map(mapSubmission) : [];
  } catch {
    return [];
  }
}

export async function uploadManualVerification(
  kind: ManualVerificationKind,
  entries: { file: File; documentType: ManualDocumentType }[],
): Promise<ManualVerificationSubmission> {
  const form = new FormData();
  form.append('kind', kind);
  entries.forEach(({ file, documentType }) => {
    form.append('files', file);
    form.append('document_types', documentType);
  });
  const res = await axios.post<Record<string, unknown>>(
    `${API_URL}/api/manual-verification/customer/`,
    form,
    { headers: getBookingTokenAuthHeaders() },
  );
  return mapSubmission(res.data);
}

export function latestSubmissionFor(
  submissions: ManualVerificationSubmission[],
  kind: ManualVerificationKind,
): ManualVerificationSubmission | null {
  return submissions.find((s) => s.kind === kind) ?? null;
}
