'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BackLink } from '@/components/ui/back-link';
import { BookingActions } from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails } from '@/components/booking/summary-cards';
import { useBookingDetails } from '@/hooks/useBooking';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import {
  createBillingCheckoutSession,
  type BillingChargeRow,
  type BillingPaymentRow,
  type BillingRefundRow,
} from '@/services/billingServices';
import { setBookingToken } from '@/utils/booking-token';
import { paths } from '@/lib/paths';
import { cn, money, formatLongDate } from '@/lib/utils';

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

function StatusPill({ charge }: { charge: BillingChargeRow }) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';
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

function ChargeRow({ charge }: { charge: BillingChargeRow }) {
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

function HistoryRow({
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
          <p className="truncate text-[13.5px] font-semibold text-ink">{label}</p>
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', pill)}>
            {status || (tone === 'refund' ? 'refunded' : 'paid')}
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

function TotalRow({
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

export default function PaymentPendingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useSearchParams().get('token');
  const [tokenReady, setTokenReady] = useState(!token);

  useEffect(() => {
    if (token) {
      setBookingToken(token);
      setTokenReady(true);
    }
  }, [token]);

  const fetchId = tokenReady ? id : undefined;
  const { data: booking, isLoading, isError } = useBookingDetails(fetchId);
  const { data: balance, isLoading: balanceLoading } = useBookingBalance(!!fetchId);

  const [payLoading, setPayLoading] = useState(false);
  const handlePay = async () => {
    if (payLoading) return;
    setPayLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const suffix = token ? `?token=${token}` : '';
      const result = await createBillingCheckoutSession({
        successUrl: `${origin}/booking/${id}${suffix}`,
        cancelUrl: `${origin}/booking/${id}/payment-pending${suffix}`,
      });
      window.location.href = result.checkout_url;
    } catch {
      setPayLoading(false);
    }
  };

  if (!tokenReady || isLoading || balanceLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted">Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={paths.home}>Back to home</BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink">Booking not found</h1>
            <p className="mt-3 text-sm text-muted">
              We couldn’t load this booking. Please use the link from your confirmation email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const outstanding = Number(balance?.outstanding_balance ?? 0);
  const totalCharged = Number(balance?.total_charged ?? booking.invoice.total);
  const totalPaid = Number(balance?.total_paid ?? 0);

  const charges = balance?.charges ?? [];
  const payments: BillingPaymentRow[] = balance?.payments ?? [];
  const refunds: BillingRefundRow[] = balance?.refunds ?? [];

  const unpaid = charges.filter(
    (c) => !c.is_voided && (c.status === 'pending' || c.status === 'partially_paid'),
  );
  const settledCharges = charges.filter(
    (c) => !c.is_voided && (c.status === 'paid' || c.status === 'refunded' || c.status === 'partially_refunded'),
  );
  const hasHistory = payments.length > 0 || refunds.length > 0 || settledCharges.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={token ? `${paths.booking(id)}?token=${token}` : paths.booking(id)}>
          Back to booking
        </BackLink>

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[14px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
            Booking <span className="text-secondary">#{booking.invoice.number}</span>
          </h1>
          <BookingActions bookingId={id} token={token} />
        </div>

        <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] min-[900px]:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[22px]">
            <VehicleDriverCard booking={booking} />
            <TripDetails booking={booking} />

            {unpaid.length > 0 && (
              <section className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="border-b border-hairline px-5 py-[14px]">
                  <h2 className="text-[15px] font-semibold text-secondary">Outstanding charges</h2>
                </div>
                <div className="divide-y divide-hairline">
                  {unpaid.map((c) => (
                    <ChargeRow key={c.id} charge={c} />
                  ))}
                </div>
              </section>
            )}

            {hasHistory && (
              <section className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="border-b border-hairline px-5 py-[14px]">
                  <h2 className="text-[15px] font-semibold text-secondary">Payment history</h2>
                </div>
                <div className="divide-y divide-hairline">
                  {settledCharges.map((c) => (
                    <ChargeRow key={c.id} charge={c} />
                  ))}
                  {payments.map((p) => (
                    <HistoryRow
                      key={`pay-${p.id}`}
                      label="Payment received"
                      amount={Number(p.amount)}
                      status={p.status}
                      date={p.succeeded_at}
                      tone="paid"
                    />
                  ))}
                  {refunds.map((r) => (
                    <HistoryRow
                      key={`ref-${r.id}`}
                      label="Refund issued"
                      amount={Number(r.amount)}
                      status={r.status}
                      date={r.succeeded_at}
                      tone="refund"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-[22px] min-[900px]:sticky min-[900px]:top-6">
            <section
              className={cn(
                'rounded-[14px] border p-5',
                outstanding > 0 ? 'border-amber-border bg-amber-bg' : 'border-green-border-2 bg-green-bg',
              )}
            >
              <p
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide',
                  outstanding > 0 ? 'text-amber-text-2' : 'text-success',
                )}
              >
                {outstanding > 0 ? 'Amount due' : 'No balance owed'}
              </p>
              <p className={cn('mt-1 text-[32px] font-bold tracking-tight-2', outstanding > 0 ? 'text-amber-text' : 'text-secondary')}>
                {money(outstanding)}
              </p>
              {outstanding > 0 && unpaid.length > 0 && (
                <p className="mt-1 text-[12px] text-amber-text-2">
                  Across {unpaid.length} unpaid {unpaid.length === 1 ? 'item' : 'items'}.
                </p>
              )}
              <button
                onClick={handlePay}
                disabled={payLoading || outstanding <= 0}
                className="mt-4 w-full rounded-lg bg-primary px-5 py-[11px] text-[14px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
              >
                {payLoading ? 'Redirecting…' : outstanding > 0 ? `Pay ${money(outstanding)}` : 'Paid in full'}
              </button>
            </section>

            <section className="rounded-[14px] border border-card-border bg-white p-5">
              <h2 className="text-[15px] font-semibold text-secondary">Summary</h2>
              <div className="mt-3">
                <TotalRow label="Total charged" value={money(totalCharged)} />
                <TotalRow label="Total paid" value={money(totalPaid)} />
                <div className="mt-2 border-t border-hairline pt-3">
                  <TotalRow
                    label="Outstanding balance"
                    value={money(outstanding)}
                    emphasis
                    highlight={outstanding > 0}
                  />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
