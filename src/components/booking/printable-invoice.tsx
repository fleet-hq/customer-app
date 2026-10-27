'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { Dyn } from '@/components/i18n/Dyn';
import { money } from '@/lib/utils';
import { chargeBreakdown } from '@/components/booking/charge-breakdown';
import type { BillingChargeRow, BillingPaymentRow, BillingRefundRow } from '@/services/billingServices';
import type { BookingDetails } from '@/services/bookingServices';

const subscribe = () => () => {};

const dateLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function Row({ label, sub, amount, strong }: { label: string; sub?: string | null; amount: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-1.5 text-[12px]">
      <div>
        <div className={strong ? 'font-semibold' : undefined}><Dyn>{label}</Dyn></div>
        {sub ? <div className="text-[11px] text-muted">{sub}</div> : null}
      </div>
      <span className={strong ? 'font-semibold tabular-nums' : 'tabular-nums'}>{money(amount)}</span>
    </div>
  );
}

export function PrintableInvoice({
  booking,
  companyName,
  charges,
  payments,
  refunds,
  outstanding,
}: {
  booking: BookingDetails;
  companyName: string;
  charges: BillingChargeRow[];
  payments: BillingPaymentRow[];
  refunds: BillingRefundRow[];
  outstanding: number;
}) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return null;
  const billed = charges.filter((charge) => !charge.is_voided);
  const charged = billed.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const refunded = refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
  const returnLabel = booking.rentalModel === 'daily' ? `${booking.dropOff.date} ${booking.dropOff.time}` : 'No fixed return';

  return createPortal(
    <section className="print-invoice bg-white p-2 text-black">
      <div className="flex items-start justify-between gap-6 border-b border-black pb-4">
        <div>
          <div className="text-[20px] font-bold">{companyName}</div>
          <div className="mt-1 text-[12px]"><Dyn>Invoice</Dyn> · <Dyn>Booking</Dyn> #{booking.bookingRef}</div>
        </div>
        <div className="text-right text-[12px]">
          <div><Dyn>Issued</Dyn> {dateLabel(new Date().toISOString())}</div>
          <div><Dyn>Booked on</Dyn> {booking.bookedOn}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 border-b border-black py-4 text-[12px]">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted"><Dyn>Billed to</Dyn></div>
          <div className="mt-1 font-semibold">{booking.customer.name}</div>
          <div>{booking.customer.email}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted"><Dyn>Rental</Dyn></div>
          <div className="mt-1 font-semibold">{booking.vehicle.name}{booking.vehicle.licensePlate ? ` · ${booking.vehicle.licensePlate}` : ''}</div>
          <div>{booking.pickUp.date} {booking.pickUp.time} → <Dyn>{returnLabel}</Dyn></div>
        </div>
      </div>

      <div className="border-b border-black py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-muted"><Dyn>Charges</Dyn></div>
        {billed.map((charge) => {
          const breakdown = chargeBreakdown(charge, booking);
          return (
            <div key={charge.id} className="print-keep-together">
              <Row label={breakdown.title} sub={breakdown.sub} amount={Number(charge.amount)} />
              {breakdown.lines.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 pl-4 text-[11px] text-muted">
                  <Dyn>{label}</Dyn>
                  <span className="tabular-nums">{money(value)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {payments.length > 0 || refunds.length > 0 ? (
        <div className="border-b border-black py-3">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-muted"><Dyn>Payments</Dyn></div>
          {payments.map((payment) => (
            <Row
              key={`pay-${payment.id}`}
              label={[(payment.covers ?? []).join(', ') || 'Payment', payment.card_label].filter(Boolean).join(' · ')}
              sub={dateLabel(payment.succeeded_at)}
              amount={Number(payment.amount)}
            />
          ))}
          {refunds.map((refund) => (
            <Row key={`ref-${refund.id}`} label={refund.reason || 'Refund'} sub={dateLabel(refund.succeeded_at)} amount={-Number(refund.amount)} />
          ))}
        </div>
      ) : null}

      <div className="ml-auto w-[260px] py-3">
        <Row label="Total charged" amount={charged} />
        <Row label="Paid" amount={paid} />
        {refunded > 0 ? <Row label="Refunded" amount={-refunded} /> : null}
        <div className="mt-1 border-t border-black pt-1">
          <Row label="Balance due" amount={outstanding} strong />
        </div>
      </div>
    </section>,
    document.body,
  );
}
