'use client';

import { cn, money } from '@/lib/utils';
import type { BillingChargeRow } from '@/services/billingServices';
import { Dyn } from '@/components/i18n/Dyn';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

// Shared by both the payment-pending and pay/booking pages (template 1)
// — moved verbatim out of what used to be duplicated local functions in
// each page.tsx so this ledger-row rendering lives in exactly one place.

export const CHARGE_TYPE_LABELS: Record<string, string> = {
  booking_fee: 'Booking',
  late_fee: 'Late fee',
  damage_fee: 'Damage fee',
  modification_charge: 'Trip modification',
  insurance_premium: 'Insurance',
  security_deposit: 'Security deposit',
  manual: 'Additional charge',
  adjustment: 'Adjustment',
  other: 'Other',
};

export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function StatusPill({ charge }: { charge: BillingChargeRow }) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';
  if (charge.is_voided || charge.status === 'voided') {
    return <span className={cn(base, 'bg-chip text-faint')}><Dyn>Voided</Dyn></span>;
  }
  if (charge.status === 'paid') {
    return <span className={cn(base, 'bg-green-bg-2 text-success')}><Dyn>Paid</Dyn></span>;
  }
  if (charge.status === 'partially_paid') {
    return <span className={cn(base, 'bg-amber-bg text-amber-text-2')}><Dyn>Partial</Dyn></span>;
  }
  if (charge.status === 'refunded' || charge.status === 'partially_refunded') {
    return <span className={cn(base, 'bg-track text-glyph')}><Dyn>Refunded</Dyn></span>;
  }
  return <span className={cn(base, 'bg-amber-bg text-amber-text-2')}><Dyn>Pending</Dyn></span>;
}

export function ChargeRow({ charge }: { charge: BillingChargeRow }) {
  const label = CHARGE_TYPE_LABELS[charge.type] ?? charge.type;
  const { t } = useDynamicTranslation([
    'Booking',
    'Late fee',
    'Damage fee',
    'Trip modification',
    'Insurance',
    'Security deposit',
    'Additional charge',
    'Adjustment',
    'Other',
  ]);
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-[14px]">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-ink">{t(label)}</p>
          <StatusPill charge={charge} />
        </div>
        {charge.description ? (
          <p className="mt-0.5 truncate text-[12px] text-muted">{charge.description}</p>
        ) : null}
        <p className="mt-0.5 text-[11px] text-faint">{fmtDate(charge.created_at)}</p>
      </div>
      <p className="shrink-0 text-[13.5px] font-semibold text-ink tabular-nums">
        {money(Number(charge.amount))}
      </p>
    </div>
  );
}

export function SyntheticBookingRow({ amount, bookedOn }: { amount: number; bookedOn: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-[14px]">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-ink"><Dyn>Booking</Dyn></p>
          <span className="inline-flex items-center rounded-full bg-green-bg-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
            <Dyn>Paid</Dyn>
          </span>
        </div>
        {bookedOn ? <p className="mt-0.5 text-[11px] text-faint">{bookedOn}</p> : null}
      </div>
      <p className="shrink-0 text-[13.5px] font-semibold text-ink tabular-nums">
        {money(amount)}
      </p>
    </div>
  );
}

export function HistoryRow({
  label,
  amount,
  status,
  date,
  tone,
}: {
  label: string;
  amount: number;
  status: string;
  date: string | null;
  tone: 'paid' | 'refund';
}) {
  const { t } = useDynamicTranslation([
    'Payment received',
    'Refund issued',
    'refunded',
    'paid',
    'succeeded',
    'pending',
    'failed',
  ]);
  const pill =
    tone === 'refund'
      ? 'bg-track text-glyph'
      : status === 'succeeded' || status === 'paid'
        ? 'bg-green-bg-2 text-success'
        : 'bg-amber-bg text-amber-text-2';
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-[14px]">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-ink">{t(label)}</p>
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', pill)}>
            {t(status || (tone === 'refund' ? 'refunded' : 'paid'))}
          </span>
        </div>
        {date ? <p className="mt-0.5 text-[11px] text-faint">{fmtDate(date)}</p> : null}
      </div>
      <p className={cn('shrink-0 text-[13.5px] font-semibold tabular-nums', tone === 'refund' ? 'text-glyph' : 'text-ink')}>
        {tone === 'refund' ? `- ${money(Number(amount))}` : money(Number(amount))}
      </p>
    </div>
  );
}

export function TotalRow({
  label,
  value,
  emphasis = false,
  highlight = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-[5px]">
      <span className={cn(emphasis ? 'text-[13.5px] font-semibold text-ink' : 'text-[12.5px] text-muted')}>
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          emphasis ? `text-[15px] font-bold ${highlight ? 'text-amber-text-2' : 'text-ink'}` : 'text-[13px] font-medium text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}
