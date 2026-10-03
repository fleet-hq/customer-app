import Link from 'next/link';
import { Check, Download, Info, Pencil, Swap, Close } from '@/components/ui/icons';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { cn } from '@/lib/utils';

function withToken(href: string, token: string | null): string {
  return token ? `${href}?token=${encodeURIComponent(token)}` : href;
}

export interface BookingActionsProps {
  bookingId: string;
  token?: string | null;
  /** Per-modification permission from the backend
   *  ``BookingDetailSerializer.can_modify``. When the operator has
   *  flipped a modification off (e.g. ``cancel_enabled=False``) or
   *  the booking is outside the window, the matching key flips false
   *  and we render the action as a disabled button rather than a
   *  live link, matching the fhq behaviour. */
  canModify?: { cancel: boolean; swap: boolean; reduce: boolean; extend: boolean };
  /** Identity verification must clear before the renter can initiate
   *  any modification — mirrors the fhq policy. */
  verificationsComplete?: boolean;
}

export function BookingActions({
  bookingId,
  token = null,
  canModify,
  verificationsComplete = true,
}: BookingActionsProps) {
  const ghost =
    'inline-flex min-w-[118px] items-center justify-center gap-[7px] rounded-[9px] border border-line bg-white px-[14px] py-[9px] text-[13px] font-medium text-ink';
  const ghostDisabled =
    'inline-flex min-w-[118px] items-center justify-center gap-[7px] rounded-[9px] border border-line bg-white px-[14px] py-[9px] text-[13px] font-medium text-faint opacity-60 cursor-not-allowed';

  // ``can_modify.extend || can_modify.reduce`` mirrors fhq's "Edit"
  // gating — Modify covers both directions of date changes.
  const canEdit = !!(canModify?.extend || canModify?.reduce);
  const canSwap = !!canModify?.swap;
  const canCancel = !!canModify?.cancel;

  // If we don't know yet, optimistically allow — backend remains the
  // source of truth and rejects the request if the policy disagrees.
  const editEnabled = (canModify ? canEdit : true) && verificationsComplete;
  const swapEnabled = (canModify ? canSwap : true) && verificationsComplete;
  const cancelEnabled = (canModify ? canCancel : true) && verificationsComplete;

  const renderAction = (
    label: string,
    icon: React.ReactNode,
    href: string,
    enabled: boolean,
  ) =>
    enabled ? (
      <Link href={withToken(href, token)} className={ghost}>
        {icon} <Dyn>{label}</Dyn>
      </Link>
    ) : (
      <button type="button" disabled className={ghostDisabled}>
        {icon} <Dyn>{label}</Dyn>
      </button>
    );

  return (
    <div className="flex flex-wrap items-center gap-[9px]">
      {renderAction('Modify', <Pencil size={14} className={editEnabled ? 'text-primary' : 'text-faint'} />, paths.modify(bookingId), editEnabled)}
      {renderAction('Change', <Swap size={14} className={swapEnabled ? 'text-primary' : 'text-faint'} />, paths.swap(bookingId), swapEnabled)}
      {renderAction('Cancel', <Close size={14} strokeWidth={2} className={cancelEnabled ? 'text-danger' : 'text-faint'} />, paths.cancel(bookingId), cancelEnabled)}
      <button
        onClick={() => window.print()}
        className="no-print inline-flex min-w-[118px] items-center justify-center gap-[7px] rounded-[9px] border border-primary bg-primary px-[14px] py-[9px] text-[13px] font-semibold text-white"
        title="Save or print this booking as a PDF"
      >
        <Download size={14} /> <Dyn>Download PDF</Dyn>
      </button>
    </div>
  );
}

export function ConfirmedBanner({ email }: { email: string }) {
  return (
    <div className="mt-4 flex items-center gap-[14px] rounded-[14px] border border-green-border-2 bg-green-bg px-5 py-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
        <Check size={22} strokeWidth={2.6} className="text-primary" />
      </span>
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-secondary"><Dyn>Booking confirmed</Dyn></div>
        <div className="mt-0.5 text-[12.5px] text-success">
          <Dyn>Your confirmation &amp; rental agreement have been sent to</Dyn> <span className="font-semibold">{email}</span>
        </div>
      </div>
    </div>
  );
}

export function AwaitingVerificationBanner({
  countdown,
  expired,
  message,
  canPay = false,
  onPay,
  payLoading = false,
  payError,
}: {
  countdown: string | null;
  expired: boolean;
  message: string;
  canPay?: boolean;
  onPay?: () => void;
  payLoading?: boolean;
  payError?: string | null;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-[14px] rounded-[14px] border border-amber-border bg-amber-bg px-5 py-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
        <Info size={20} strokeWidth={2.2} className="text-accent" />
      </span>
      <div className="min-w-[200px] flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-text-2">
          <Dyn>Awaiting verification</Dyn>
        </div>
        <div className="mt-0.5 text-[13px] font-semibold text-amber-text"><Dyn>{message}</Dyn></div>
        <div className="mt-0.5 text-[12.5px] text-amber-text-2">
          <Dyn>Your vehicle slot is held until verification is finished.</Dyn>
        </div>
        {payError && (
          <div className="mt-1 text-[12px] font-medium text-danger"><Dyn>{payError}</Dyn></div>
        )}
      </div>
      {canPay && onPay && !expired && (
        <button
          onClick={onPay}
          disabled={payLoading}
          className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Dyn>{payLoading ? 'Redirecting…' : 'Continue to payment'}</Dyn>
        </button>
      )}
      {countdown && (
        <div
          className={cn(
            'flex flex-col items-end justify-center rounded-md border px-3 py-1.5 leading-tight',
            expired ? 'border-danger-border bg-danger-bg text-danger-text' : 'border-amber-border bg-white text-amber-text',
          )}
        >
          <span className="text-[9px] font-medium uppercase tracking-wide"><Dyn>Hold expires in</Dyn></span>
          <span className="text-sm font-semibold tabular-nums">{countdown}</span>
        </div>
      )}
    </div>
  );
}

export function CancelledBanner() {
  return (
    <div className="mt-4 flex items-center gap-[14px] rounded-[14px] border border-danger-border bg-danger-bg px-5 py-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
        <Close size={20} strokeWidth={2.4} className="text-danger" />
      </span>
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-danger-text"><Dyn>Booking cancelled</Dyn></div>
        <div className="mt-0.5 text-[12.5px] text-danger-text">
          <Dyn>This booking has been cancelled and can no longer be modified.</Dyn>
        </div>
      </div>
    </div>
  );
}

export function PaymentDueBanner({ amount, onPay, payLoading = false }: { amount: string; onPay?: () => void; payLoading?: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-[14px] rounded-[14px] border border-amber-border bg-amber-bg px-5 py-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
        <Info size={20} strokeWidth={2.2} className="text-accent" />
      </span>
      <div className="min-w-[200px] flex-1">
        <div className="text-[15px] font-semibold text-amber-text"><Dyn>Payment due — new charges added</Dyn></div>
        <div className="mt-0.5 text-[12.5px] text-amber-text-2">
          <Dyn>Your trip changes added</Dyn> <span className="font-semibold">{amount}</span>. <Dyn>Complete payment to confirm.</Dyn>
        </div>
      </div>
      <button
        onClick={onPay}
        disabled={payLoading || !onPay}
        className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold whitespace-nowrap text-white disabled:opacity-50"
      >
        <Dyn>{payLoading ? 'Redirecting…' : `Pay ${amount}`}</Dyn>
      </button>
    </div>
  );
}
