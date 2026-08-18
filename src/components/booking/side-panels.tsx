'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, Close, ChevronLeft } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { MAX_IMAGE_UPLOAD_MB, MAX_IMAGE_UPLOAD_BYTES } from '@/lib/constants';
import { useUploadTripImage, useDeleteTripImage } from '@/hooks/useTripImages';
import type { TripImage, ImageType } from '@/services/tripImageServices';

export interface NextStep {
  done: boolean;
  title: string;
  desc: string;
  cta: string;
  ctaHref?: string;
  onAction?: () => void;
  pending?: boolean;
  pendingLabel?: string;
  sent?: boolean;
  sentLabel?: string;
  error?: string | null;
}

export function buildNextSteps(args: {
  idVerified: boolean;
  insuranceVerified: boolean;
  showInsurance: boolean;
  agreementHref: string;
  agreementSigned: boolean;
  onIdVerify: () => void;
  idPending: boolean;
  idError: string | null;
  onInsuranceVerify: () => void;
  insurancePending: boolean;
  insuranceSent: boolean;
  insuranceError: string | null;
}): NextStep[] {
  const steps: NextStep[] = [
    {
      done: args.agreementSigned,
      title: 'Rental agreement',
      desc: args.agreementSigned
        ? 'Signed | You can view or download the agreement from here.'
        : 'Review and sign your rental agreement to complete your booking.',
      cta: args.agreementSigned ? 'View agreement' : 'Sign now',
      ctaHref: args.agreementHref,
    },
    {
      done: args.idVerified,
      title: 'ID verification',
      desc: args.idVerified
        ? 'Your identity has been verified.'
        : 'Verify your identity to complete your booking.',
      cta: args.idVerified ? 'View' : 'Verify now',
      onAction: args.idVerified ? undefined : args.onIdVerify,
      pending: args.idPending,
      pendingLabel: 'Redirecting…',
      error: args.idError,
    },
  ];
  if (args.showInsurance) {
    steps.push({
      done: args.insuranceVerified,
      title: 'Insurance verification',
      desc: args.insuranceVerified
        ? 'Your coverage has been confirmed.'
        : 'Confirm your protection or your own coverage.',
      cta: args.insuranceVerified ? 'View' : 'Verify now',
      onAction: args.insuranceVerified ? undefined : args.onInsuranceVerify,
      pending: args.insurancePending,
      pendingLabel: 'Sending…',
      sent: args.insuranceSent && !args.insuranceVerified,
      sentLabel: 'Verification link sent — check your email.',
      error: args.insuranceError,
    });
  }
  return steps;
}

export function NextSteps({ steps }: { steps: NextStep[] }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white px-5 py-[18px]">
      <h3 className="mb-[6px] text-sm font-semibold text-ink">Next steps</h3>
      <div className="flex flex-col">
        {steps.map((st, i) => (
          <div
            key={st.title}
            className={cn('flex items-center gap-[14px] py-[14px]', i > 0 && 'border-t border-hairline')}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full',
                    st.done ? 'bg-primary' : 'border-2 border-accent bg-white',
                  )}
                >
                  {st.done && <Check size={11} strokeWidth={3} className="text-white" />}
                </span>
                <span className="text-[13px] font-semibold text-ink">{st.title}</span>
                <span
                  className={cn(
                    'rounded-full px-[7px] py-[2px] text-[10px] font-semibold',
                    st.done ? 'bg-green-bg-2 text-success' : 'bg-amber-bg text-amber-text-2',
                  )}
                >
                  {st.done ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="mt-1 pl-[26px] text-[11.5px] leading-[1.45] text-faint">{st.desc}</div>
              {st.sent && (
                <div className="mt-1 pl-[26px] text-[11.5px] font-medium leading-[1.45] text-success">
                  {st.sentLabel}
                </div>
              )}
              {st.error && (
                <div className="mt-1 pl-[26px] text-[11.5px] leading-[1.45] text-danger-text">{st.error}</div>
              )}
            </div>
            {st.onAction ? (
              <button
                type="button"
                onClick={st.onAction}
                disabled={st.pending || st.sent}
                className="min-w-[112px] flex-shrink-0 rounded-[7px] bg-primary px-4 py-2 text-center text-xs font-semibold whitespace-nowrap text-white disabled:opacity-50"
              >
                {st.pending ? st.pendingLabel : st.sent ? 'Sent' : st.cta}
              </button>
            ) : (
              <Link
                href={st.ctaHref ?? '#'}
                className={cn(
                  'min-w-[112px] flex-shrink-0 rounded-[7px] px-4 py-2 text-center text-xs font-semibold whitespace-nowrap',
                  st.done ? 'border border-line text-ink' : 'bg-primary text-white',
                )}
              >
                {st.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PhotoGroup {
  title: string;
  hint?: string;
  photos: TripImage[];
  imageType: ImageType;
}

export function TripPhotos({
  groups,
  note,
  bookingId,
  canUpload,
}: {
  groups: PhotoGroup[];
  note: string;
  bookingId: string;
  canUpload: boolean;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-white px-5 py-[18px]">
      <h3 className="mb-1 text-sm font-semibold text-ink">Trip photos</h3>
      <p className="mb-4 text-[11.5px] leading-[1.45] text-faint">{note}</p>
      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <PhotoGroupRow key={g.title} group={g} bookingId={bookingId} canUpload={canUpload} />
        ))}
      </div>
    </div>
  );
}

function PhotoGroupRow({
  group,
  bookingId,
  canUpload,
}: {
  group: PhotoGroup;
  bookingId: string;
  canUpload: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadImage } = useUploadTripImage();
  const { mutate: deleteImage, isPending: isDeleting } = useDeleteTripImage();
  const [pendingCount, setPendingCount] = useState(0);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const count = group.photos.length;
  const pendingLabel =
    pendingCount > 0
      ? `Uploading ${pendingCount} file${pendingCount === 1 ? "" : "s"}…`
      : null;
  const meta =
    pendingLabel ??
    (count > 0
      ? `${count} photo${count === 1 ? "" : "s"}`
      : (group.hint ?? "No photos yet"));

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArr = Array.from(files);
      const ok = fileArr.filter((f) => f.size <= MAX_IMAGE_UPLOAD_BYTES);
      const tooBig = fileArr.length - ok.length;
      setSizeError(
        tooBig > 0
          ? `${tooBig} file${tooBig === 1 ? '' : 's'} skipped — each must be under ${MAX_IMAGE_UPLOAD_MB}MB.`
          : null,
      );
      if (ok.length > 0) {
        setPendingCount((n) => n + ok.length);
        // Each upload gets its own promise via mutateAsync — a shared
        // mutation's per-call onSettled only fires for the LAST mutate()
        // call, which left the spinner stuck when uploading several files.
        ok.forEach((file) => {
          uploadImage({ bookingId, imageFile: file, imageType: group.imageType })
            .catch(() => {})
            .finally(() => setPendingCount((n) => Math.max(0, n - 1)));
        });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const emptyPlaceholders = count === 0 && pendingCount === 0 ? 3 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-ink">
          {group.title} <span className="font-medium text-placeholder">· {meta}</span>
        </div>
        <span className="shrink-0 text-[10px] font-medium text-placeholder">
          Max {MAX_IMAGE_UPLOAD_MB}MB per photo
        </span>
      </div>
      {sizeError && (
        <p className="mb-2 text-[11px] font-medium text-danger">{sizeError}</p>
      )}
      <div
        className="grid gap-[6px]"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 72px))" }}
      >
        {group.photos.map((p, i) => (
          <div
            key={p.id}
            onClick={() => setLightboxIdx(i)}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-[7px] bg-cover bg-center"
            style={{ backgroundImage: `url('${p.imageUrl}')` }}
          >
            {canUpload && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteImage({ bookingId, imageId: p.id });
                }}
                disabled={isDeleting}
                className="absolute top-0.5 right-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
              >
                <Close size={8} strokeWidth={3} className="text-white" />
              </button>
            )}
          </div>
        ))}
        {Array.from({ length: pendingCount }).map((_, i) => (
          <div
            key={`pending-${i}`}
            className="flex aspect-square items-center justify-center rounded-[7px] border-[1.5px] border-dashed border-dash bg-subtle"
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-card-border border-t-primary" />
          </div>
        ))}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!canUpload}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[7px] border-[1.5px] border-dashed border-dash text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          <span className="text-[9px] font-semibold text-faint">Add</span>
        </button>
        {Array.from({ length: emptyPlaceholders }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="aspect-square rounded-[7px] border-[1.5px] border-dashed border-dash/60 bg-subtle/40"
          />
        ))}
      </div>

      {lightboxIdx !== null && group.photos[lightboxIdx] && (
        <Dialog
          isOpen={true}
          onClose={() => setLightboxIdx(null)}
          panelClassName="max-w-[92vw] sm:max-w-[820px] bg-transparent shadow-none overflow-visible"
        >
          <div className="relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={group.photos[lightboxIdx].imageUrl}
              alt={`${group.title} photo ${lightboxIdx + 1}`}
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
            <button
              type="button"
              aria-label="Close"
              onClick={() => setLightboxIdx(null)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <Close size={16} className="text-white" />
            </button>
            {group.photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() =>
                    setLightboxIdx((n) =>
                      n === null
                        ? n
                        : (n - 1 + group.photos.length) % group.photos.length,
                    )
                  }
                  className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronLeft size={18} className="text-white" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() =>
                    setLightboxIdx((n) =>
                      n === null ? n : (n + 1) % group.photos.length,
                    )
                  }
                  className="absolute right-2 bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronLeft size={18} className="rotate-180 text-white" />
                </button>
              </>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
