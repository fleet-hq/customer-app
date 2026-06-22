'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Check, Plus, Close } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
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
      done: true,
      title: 'Vehicle booked',
      desc: 'Confirmed — details are in your inbox.',
      cta: 'View agreement',
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
  const { mutate: uploadImage, isPending: isUploading } = useUploadTripImage();
  const { mutate: deleteImage, isPending: isDeleting } = useDeleteTripImage();

  const count = group.photos.length;
  const meta = count > 0 ? `${count} photo${count === 1 ? '' : 's'}` : (group.hint ?? 'No photos yet');

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        uploadImage({ bookingId, imageFile: file, imageType: group.imageType });
      });
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-ink">
          {group.title} <span className="font-medium text-placeholder">· {meta}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-[7px]">
        {group.photos.map((p) => (
          <div
            key={p.id}
            className="group relative aspect-square overflow-hidden rounded-[9px] bg-cover bg-center"
            style={{ backgroundImage: `url('${p.imageUrl}')` }}
          >
            {canUpload && (
              <button
                type="button"
                onClick={() => deleteImage({ bookingId, imageId: p.id })}
                disabled={isDeleting}
                className="absolute top-1 right-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
              >
                <Close size={9} strokeWidth={3} className="text-white" />
              </button>
            )}
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
          disabled={!canUpload || isUploading}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[9px] border-[1.5px] border-dashed border-dash text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-card-border border-t-primary" />
          ) : (
            <>
              <Plus size={16} />
              <span className="text-[9px] font-semibold text-faint">Add</span>
            </>
          )}
        </button>
        {count === 0 &&
          [0, 1, 2].map((i) => (
            <div key={i} className="aspect-square rounded-[9px] border border-hairline bg-subtle" />
          ))}
      </div>
    </div>
  );
}
