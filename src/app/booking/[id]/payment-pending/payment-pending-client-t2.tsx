'use client';

import { BackLink } from '@/components/ui/back-link';
import { BookingActions } from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails } from '@/components/booking/summary-cards';
import { ChargeRowT2, HistoryRowT2, TotalRowT2 } from '@/components/booking/billing-ledger-t2';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { usePaymentPending } from './use-payment-pending';
import styles from '@/styles/template-2.module.css';
import { CardConsent } from '@/components/booking/card-consent';

export default function PaymentPendingClientT2({ id }: { id: string }) {
  const {
    token,
    tokenReady,
    isLoading,
    isError,
    booking,
    balanceLoading,
    t,
    payLoading,
    tenant,
    handlePay,
    staffAskedForCard,
    saveCard,
    chooseSaveCard,
    consentBlocked,
    outstanding,
    totalCharged,
    totalPaid,
    payments,
    refunds,
    unpaid,
    settledCharges,
    hasHistory,
  } = usePaymentPending(id);

  if (!tokenReady || isLoading || balanceLoading) {
    return (
      <div className={styles.section}>
        <div className={styles.container} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Dyn>Loading payment details…</Dyn>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className={styles.section}>
        <div className={styles.container}>
          <BackLink href={paths.home}><Dyn>Back to home</Dyn></BackLink>
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <h1><Dyn>Booking not found</Dyn></h1>
            <p style={{ marginTop: '0.6rem', color: 'var(--text-muted)' }}>
              <Dyn>We couldn’t load this booking. Please use the link from your confirmation email.</Dyn>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <BackLink href={token ? `${paths.booking(id)}?token=${token}` : paths.booking(id)}>
          <Dyn>Back to booking</Dyn>
        </BackLink>

        <div className={styles.pageTop}>
          <h1>
            <Dyn>Booking</Dyn> <span style={{ color: 'var(--text-muted)' }}>#{booking.invoice.number}</span>
          </h1>
          <BookingActions bookingId={id} token={token} />
        </div>

        <div className={styles.detailColumns}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <VehicleDriverCard booking={booking} />
            <TripDetails booking={booking} />

            {unpaid.length > 0 && (
              <section className={styles.ledgerCard}>
                <div className={styles.ledgerCardHead}><Dyn>Outstanding charges</Dyn></div>
                <div>
                  {unpaid.map((c) => (
                    <ChargeRowT2 key={c.id} charge={c} />
                  ))}
                </div>
              </section>
            )}

            {hasHistory && (
              <section className={styles.ledgerCard}>
                <div className={styles.ledgerCardHead}><Dyn>Payment history</Dyn></div>
                <div>
                  {settledCharges.map((c) => (
                    <ChargeRowT2 key={c.id} charge={c} />
                  ))}
                  {payments.map((p) => (
                    <HistoryRowT2
                      key={`pay-${p.id}`}
                      label="Payment received"
                      amount={Number(p.amount)}
                      status={p.status}
                      date={p.succeeded_at}
                      tone="paid"
                    />
                  ))}
                  {refunds.map((r) => (
                    <HistoryRowT2
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

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <section className={`${styles.balanceCard} ${outstanding > 0 ? styles.balanceCardDue : styles.balanceCardClear}`}>
              <p className={styles.balanceLabel} style={{ color: outstanding > 0 ? 'var(--danger)' : 'var(--brass)' }}>
                {outstanding > 0 ? t('Amount due') : t('No balance owed')}
              </p>
              <p className={styles.balanceAmount}>{money(outstanding)}</p>
              {outstanding > 0 && unpaid.length > 0 && (
                <p className={styles.balanceNote}>
                  <Dyn>Across</Dyn> {unpaid.length} <Dyn>unpaid</Dyn> {unpaid.length === 1 ? t('item') : t('items')}.
                </p>
              )}
              {staffAskedForCard && outstanding > 0 ? (
                <CardConsent
                  checked={saveCard}
                  onChange={chooseSaveCard}
                  companyName={tenant.name}
                  depositAmount={booking?.invoice.deposit}
                  required
                />
              ) : null}
              <button
                type="button"
                onClick={handlePay}
                disabled={payLoading || outstanding <= 0 || consentBlocked}
                className={`${styles.btn} ${styles.btnBrass} ${styles.reserveBtn}`}
              >
                {payLoading ? t('Redirecting…') : outstanding > 0 ? `${t('Pay')} ${money(outstanding)}` : t('Paid in full')}
              </button>
            </section>

            <section className={styles.priceCard} style={{ position: 'static' }}>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 600 }}><Dyn>Summary</Dyn></h2>
              <div style={{ marginTop: '0.8rem' }}>
                <TotalRowT2 label={t('Total charged')} value={money(totalCharged)} />
                <TotalRowT2 label={t('Total paid')} value={money(totalPaid)} />
                <div className={styles.priceDivider} />
                <TotalRowT2
                  label={t('Outstanding balance')}
                  value={money(outstanding)}
                  emphasis
                  highlight={outstanding > 0}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
