'use client';

import type { BillingChargeRow } from '@/services/billingServices';
import { cn, money } from '@/lib/utils';

const CHARGE_TYPE_LABELS: Record<string, string> = {
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

function fmtDate(iso: string): string {
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
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';
  if (charge.is_voided || charge.status === 'voided') {
    return <span className={cn(base, 'bg-chip text-faint')}>Voided</span>;
  }
  if (charge.status === 'paid') {
    return <span className={cn(base, 'bg-green-bg-2 text-success')}>Paid</span>;
  }
  if (charge.status === 'partially_paid') {
    return <span className={cn(base, 'bg-amber-bg text-amber-text-2')}>Partial</span>;
  }
  if (charge.status === 'refunded' || charge.status === 'partially_refunded') {
    return <span className={cn(base, 'bg-track text-glyph')}>Refunded</span>;
  }
  return <span className={cn(base, 'bg-amber-bg text-amber-text-2')}>Pending</span>;
}

export function ChargeRow({ charge }: { charge: BillingChargeRow }) {
  const label = CHARGE_TYPE_LABELS[charge.type] ?? charge.type;
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-[14px]">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-ink">{label}</p>
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

/** Outstanding-charge breakdown card for the booking detail page.
 *  Only renders when there are pending/partially-paid charges (paid &
 *  voided charges live on the dedicated payment history page). */
export function OutstandingChargesCard({
  charges,
  paymentPendingHref,
}: {
  charges: BillingChargeRow[];
  /** When set, a "View all charges & history" link is rendered at
   *  the bottom — points at the dedicated ``/payment-pending`` route
   *  that lists every charge, payment and refund in full. */
  paymentPendingHref?: string;
}) {
  const outstanding = charges.filter(
    (c) =>
      !c.is_voided &&
      c.status !== 'voided' &&
      c.status !== 'paid' &&
      Number(c.outstanding) > 0,
  );
  if (outstanding.length === 0) return null;
  return (
    <div className="rounded-2xl border border-card-border bg-white p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
        <span className="text-[15px] font-semibold text-ink">Outstanding charges</span>
        <span className="text-[11px] font-medium text-faint">
          {outstanding.length} {outstanding.length === 1 ? 'charge' : 'charges'} due
        </span>
      </div>
      <div className="divide-y divide-card-border">
        {outstanding.map((c) => (
          <ChargeRow key={c.id} charge={c} />
        ))}
      </div>
      {paymentPendingHref ? (
        <div className="px-5 py-3 text-right">
          <a
            href={paymentPendingHref}
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            View all charges &amp; payment history →
          </a>
        </div>
      ) : null}
    </div>
  );
}
