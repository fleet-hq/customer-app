'use client';

import { useState } from 'react';
import { ChargeRow, HistoryRow, SyntheticBookingRow } from '@/components/booking/billing-ledger';
import { ChargeRowT2, HistoryRowT2, SyntheticBookingRowT2 } from '@/components/booking/billing-ledger-t2';
import { CardConsent } from '@/components/booking/card-consent';
import { PaymentLinkStatus } from '@/components/booking/payment-link-status';
import { SecondaryButton } from '@/components/booking/secondary-button';
import { Dyn } from '@/components/i18n/Dyn';
import { useBookingPayment } from '@/hooks/use-booking-payment';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { useTenant } from '@/lib/tenant-context';
import { useIsT2 } from '@/lib/use-is-t2';
import { cn, money } from '@/lib/utils';
import styles from '@/styles/template-2.module.css';

export function PaymentLinkCard({ bookingId, enabled }: { bookingId: string; enabled: boolean }) {
  const isT2 = useIsT2();
  const tenant = useTenant();
  const pay = useBookingPayment(bookingId, enabled);
  const { t } = useDynamicTranslation(['Amount due', 'No balance owed', 'Redirecting…', 'Pay', 'Paid in full']);
  if (!pay.isLink || !pay.linkView) return null;

  if (pay.linkView !== 'pay') {
    return (
      <PaymentLinkStatus
        view={pay.linkView}
        amount={pay.amountDue}
        covers={pay.covers}
        cardLast4={pay.cardLast4}
        onRetry={pay.handlePay}
        retrying={pay.payLoading}
      />
    );
  }

  const due = pay.amountDue > 0;
  const consent = pay.staffAskedForCard && due ? (
    <CardConsent
      checked={pay.saveCard}
      onChange={pay.chooseSaveCard}
      companyName={tenant.name}
      depositAmount={pay.depositAmount}
      required={false}
    />
  ) : null;
  const label = pay.payLoading ? t('Redirecting…') : due ? `${t('Pay')} ${money(pay.amountDue)}` : t('Paid in full');

  if (isT2) {
    return (
      <section className={`${styles.balanceCard} ${due ? styles.balanceCardDue : styles.balanceCardClear}`}>
        <p className={styles.balanceLabel} style={{ color: due ? 'var(--danger)' : 'var(--brass)' }}>
          {due ? t('Amount due') : t('No balance owed')}
        </p>
        <p className={styles.balanceAmount}>{money(pay.amountDue)}</p>
        {pay.covers ? <p className={styles.balanceNote}><Dyn>{pay.covers}</Dyn></p> : null}
        {consent}
        <button
          type="button"
          onClick={pay.handlePay}
          disabled={pay.payLoading || !due}
          className={`${styles.btn} ${styles.btnBrass} ${styles.reserveBtn}`}
        >
          {label}
        </button>
      </section>
    );
  }

  return (
    <section className={cn('rounded-[14px] border p-5', due ? 'border-amber-border bg-amber-bg' : 'border-green-border-2 bg-green-bg')}>
      <p className={cn('text-[10px] font-semibold uppercase tracking-wide', due ? 'text-amber-text-2' : 'text-success')}>
        {due ? t('Amount due') : t('No balance owed')}
      </p>
      <p className={cn('mt-1 text-[32px] font-bold tracking-tight-2', due ? 'text-amber-text' : 'text-secondary')}>
        {money(pay.amountDue)}
      </p>
      {pay.covers ? <p className="mt-1 text-[12px] text-amber-text-2"><Dyn>{pay.covers}</Dyn></p> : null}
      {consent}
      <button
        type="button"
        onClick={pay.handlePay}
        disabled={pay.payLoading || !due}
        className="mt-4 w-full rounded-lg bg-primary px-5 py-[11px] text-[14px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
      >
        {label}
      </button>
    </section>
  );
}

export function PaymentHistory({ bookingId, enabled }: { bookingId: string; enabled: boolean }) {
  const isT2 = useIsT2();
  const pay = useBookingPayment(bookingId, enabled);
  const [open, setOpen] = useState(false);
  if (!pay.hasHistory) return null;
  if (!open) {
    return (
      <SecondaryButton onClick={() => setOpen(true)} aria-expanded={false}>
        <Dyn>View payment history</Dyn>
      </SecondaryButton>
    );
  }

  const Charge = isT2 ? ChargeRowT2 : ChargeRow;
  const History = isT2 ? HistoryRowT2 : HistoryRow;
  const Synthetic = isT2 ? SyntheticBookingRowT2 : SyntheticBookingRow;
  const rows = (
    <>
      {pay.showSyntheticBooking && <Synthetic amount={pay.syntheticBookingTotal} bookedOn={pay.bookedOn} />}
      {pay.settledCharges.map((c) => (
        <Charge key={c.id} charge={c} />
      ))}
      {pay.payments.map((p) => (
        <History key={`pay-${p.id}`} label="Payment received" amount={Number(p.amount)} status={p.status} date={p.succeeded_at} tone="paid" />
      ))}
      {pay.refunds.map((r) => (
        <History key={`ref-${r.id}`} label="Refund issued" amount={Number(r.amount)} status={r.status} date={r.succeeded_at} tone="refund" />
      ))}
    </>
  );

  if (isT2) {
    return (
      <section className={styles.ledgerCard}>
        <div className={styles.ledgerCardHead} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Dyn>Payment history</Dyn>
          <button type="button" onClick={() => setOpen(false)} aria-expanded className={styles.linkMore}><Dyn>Hide</Dyn></button>
        </div>
        <div>{rows}</div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[14px] border border-card-border bg-white">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-[14px]">
        <h2 className="text-[15px] font-semibold text-secondary"><Dyn>Payment history</Dyn></h2>
        <button type="button" onClick={() => setOpen(false)} aria-expanded className="text-[12.5px] font-semibold text-primary hover:text-primary-hover">
          <Dyn>Hide</Dyn>
        </button>
      </div>
      <div className="divide-y divide-hairline">{rows}</div>
    </section>
  );
}
