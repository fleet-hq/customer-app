'use client';

import { use } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { BookingActions } from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails } from '@/components/booking/summary-cards';
import { ChargeRow, HistoryRow, TotalRow } from '@/components/booking/billing-ledger';
import { paths } from '@/lib/paths';
import { cn, money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { usePaymentPending } from './use-payment-pending';
import PaymentPendingClientT2 from './payment-pending-client-t2';
import { CardConsent } from '@/components/booking/card-consent';

export default function PaymentPendingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pp = usePaymentPending(id);

  if (pp.tenant.websiteTemplate === 'template_2') {
    return <PaymentPendingClientT2 id={id} />;
  }

  const {
    tenant,
    token,
    tokenReady,
    isLoading,
    isError,
    booking,
    balanceLoading,
    t,
    payLoading,
    handlePay,
    staffAskedForCard,
    saveCard,
    chooseSaveCard,
    outstanding,
    totalCharged,
    totalPaid,
    payments,
    refunds,
    unpaid,
    settledCharges,
    hasHistory,
  } = pp;

  if (!tokenReady || isLoading || balanceLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted"><Dyn>Loading payment details…</Dyn></p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={paths.home}><Dyn>Back to home</Dyn></BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink"><Dyn>Booking not found</Dyn></h1>
            <p className="mt-3 text-sm text-muted">
              <Dyn>We couldn’t load this booking. Please use the link from your confirmation email.</Dyn>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={token ? `${paths.booking(id)}?token=${token}` : paths.booking(id)}>
          <Dyn>Back to booking</Dyn>
        </BackLink>

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[14px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
            <Dyn>Booking</Dyn> <span className="text-secondary">#{booking.invoice.number}</span>
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
                  <h2 className="text-[15px] font-semibold text-secondary"><Dyn>Outstanding charges</Dyn></h2>
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
                  <h2 className="text-[15px] font-semibold text-secondary"><Dyn>Payment history</Dyn></h2>
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
                {outstanding > 0 ? t('Amount due') : t('No balance owed')}
              </p>
              <p className={cn('mt-1 text-[32px] font-bold tracking-tight-2', outstanding > 0 ? 'text-amber-text' : 'text-secondary')}>
                {money(outstanding)}
              </p>
              {outstanding > 0 && unpaid.length > 0 && (
                <p className="mt-1 text-[12px] text-amber-text-2">
                  <Dyn>Across</Dyn> {unpaid.length} <Dyn>unpaid</Dyn> {unpaid.length === 1 ? t('item') : t('items')}.
                </p>
              )}
              {staffAskedForCard && outstanding > 0 ? (
                <CardConsent
                  checked={saveCard}
                  onChange={chooseSaveCard}
                  companyName={tenant.name}
                  depositAmount={booking?.invoice.deposit}
                />
              ) : null}
              <button
                onClick={handlePay}
                disabled={payLoading || outstanding <= 0}
                className="mt-4 w-full rounded-lg bg-primary px-5 py-[11px] text-[14px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
              >
                {payLoading ? t('Redirecting…') : outstanding > 0 ? `${t('Pay')} ${money(outstanding)}` : t('Paid in full')}
              </button>
            </section>

            <section className="rounded-[14px] border border-card-border bg-white p-5">
              <h2 className="text-[15px] font-semibold text-secondary"><Dyn>Summary</Dyn></h2>
              <div className="mt-3">
                <TotalRow label={t('Total charged')} value={money(totalCharged)} />
                <TotalRow label={t('Total paid')} value={money(totalPaid)} />
                <div className="mt-2 border-t border-hairline pt-3">
                  <TotalRow
                    label={t('Outstanding balance')}
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
