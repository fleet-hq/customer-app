import Link from 'next/link';
import { Check, Download, Info, Pencil, Swap, Close } from '@/components/ui/icons';
import { paths } from '@/lib/paths';

export function BookingActions({ bookingId }: { bookingId: string }) {
  const ghost =
    'inline-flex min-w-[118px] items-center justify-center gap-[7px] rounded-[9px] border border-line bg-white px-[14px] py-[9px] text-[13px] font-medium text-ink';
  return (
    <div className="flex flex-wrap items-center gap-[9px]">
      <Link href={paths.modify(bookingId)} className={ghost}>
        <Pencil size={14} className="text-primary" /> Modify
      </Link>
      <Link href={paths.swap(bookingId)} className={ghost}>
        <Swap size={14} className="text-primary" /> Change
      </Link>
      <Link href={paths.cancel(bookingId)} className={ghost}>
        <Close size={14} strokeWidth={2} className="text-danger" /> Cancel
      </Link>
      <button className="inline-flex min-w-[118px] items-center justify-center gap-[7px] rounded-[9px] border border-primary bg-primary px-[14px] py-[9px] text-[13px] font-semibold text-white">
        <Download size={14} /> Download
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
        <div className="text-[15px] font-semibold text-secondary">Booking confirmed</div>
        <div className="mt-0.5 text-[12.5px] text-success">
          Your confirmation &amp; rental agreement have been sent to <span className="font-semibold">{email}</span>
        </div>
      </div>
    </div>
  );
}

export function PaymentDueBanner({ amount }: { amount: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-[14px] rounded-[14px] border border-amber-border bg-amber-bg px-5 py-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
        <Info size={20} strokeWidth={2.2} className="text-accent" />
      </span>
      <div className="min-w-[200px] flex-1">
        <div className="text-[15px] font-semibold text-amber-text">Payment due — new charges added</div>
        <div className="mt-0.5 text-[12.5px] text-amber-text-2">
          Your trip changes added <span className="font-semibold">{amount}</span>. Complete payment to confirm.
        </div>
      </div>
      <button className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold whitespace-nowrap text-white">
        Pay {amount}
      </button>
    </div>
  );
}
