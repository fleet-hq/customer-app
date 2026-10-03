'use client';

import { money } from '@/lib/utils';
import type { BillingChargeRow } from '@/services/billingServices';
import { Dyn } from '@/components/i18n/Dyn';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { CHARGE_TYPE_LABELS, fmtDate } from './billing-ledger';
import styles from '@/styles/template-2.module.css';

// Template-2 counterpart of billing-ledger.tsx's row components — shared
// by the payment-pending and pay/booking T2 pages so this ledger-row
// rendering lives in exactly one place, styled with the T2 design
// tokens instead of template 1's Tailwind classes.

export function StatusPillT2({ charge }: { charge: BillingChargeRow }) {
  if (charge.is_voided || charge.status === 'voided') {
    return <span className={`${styles.pill} ${styles.pillNeutral}`}><Dyn>Voided</Dyn></span>;
  }
  if (charge.status === 'paid') {
    return <span className={`${styles.pill} ${styles.pillGood}`}><Dyn>Paid</Dyn></span>;
  }
  if (charge.status === 'partially_paid') {
    return <span className={`${styles.pill} ${styles.pillWarn}`}><Dyn>Partial</Dyn></span>;
  }
  if (charge.status === 'refunded' || charge.status === 'partially_refunded') {
    return <span className={`${styles.pill} ${styles.pillNeutral}`}><Dyn>Refunded</Dyn></span>;
  }
  return <span className={`${styles.pill} ${styles.pillWarn}`}><Dyn>Pending</Dyn></span>;
}

export function ChargeRowT2({ charge }: { charge: BillingChargeRow }) {
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
    <div className={styles.ledgerRow}>
      <div className={styles.ledgerRowInfo}>
        <div className={styles.ledgerRowTitle}>
          <span>{t(label)}</span>
          <StatusPillT2 charge={charge} />
        </div>
        {charge.description ? <div className={styles.ledgerRowMeta}>{charge.description}</div> : null}
        <div className={styles.ledgerRowMeta}>{fmtDate(charge.created_at)}</div>
      </div>
      <div className={styles.ledgerRowAmount}>{money(Number(charge.amount))}</div>
    </div>
  );
}

export function SyntheticBookingRowT2({ amount, bookedOn }: { amount: number; bookedOn: string }) {
  return (
    <div className={styles.ledgerRow}>
      <div className={styles.ledgerRowInfo}>
        <div className={styles.ledgerRowTitle}>
          <span><Dyn>Booking</Dyn></span>
          <span className={`${styles.pill} ${styles.pillGood}`}><Dyn>Paid</Dyn></span>
        </div>
        {bookedOn ? <div className={styles.ledgerRowMeta}>{bookedOn}</div> : null}
      </div>
      <div className={styles.ledgerRowAmount}>{money(amount)}</div>
    </div>
  );
}

export function HistoryRowT2({
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
  const pillClass = tone === 'refund' ? styles.pillNeutral : styles.pillGood;
  return (
    <div className={styles.ledgerRow}>
      <div className={styles.ledgerRowInfo}>
        <div className={styles.ledgerRowTitle}>
          <span>{t(label)}</span>
          <span className={`${styles.pill} ${pillClass}`}>{t(status || (tone === 'refund' ? 'refunded' : 'paid'))}</span>
        </div>
        {date ? <div className={styles.ledgerRowMeta}>{fmtDate(date)}</div> : null}
      </div>
      <div className={styles.ledgerRowAmount}>{tone === 'refund' ? `- ${money(Number(amount))}` : money(Number(amount))}</div>
    </div>
  );
}

export function TotalRowT2({
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
    <div className={styles.priceLine} style={{ marginTop: emphasis ? '0.3rem' : undefined }}>
      <span style={{ fontWeight: emphasis ? 600 : 400, color: emphasis ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: emphasis ? 700 : 500, color: highlight ? 'var(--brass)' : 'var(--text)' }}>{value}</span>
    </div>
  );
}
