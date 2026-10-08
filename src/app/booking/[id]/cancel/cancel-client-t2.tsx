'use client';

import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';
import { money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { useBookingCancel, REASONS } from './use-booking-cancel';
import styles from '@/styles/template-2.module.css';

export default function CancelBookingClientT2({ id }: { id: string }) {
  const bc = useBookingCancel(id);

  const {
    booking,
    loading,
    cancelling,
    error,
    reason,
    setReason,
    notes,
    setNotes,
    cancelled,
    t,
    bookingLink,
    insuranceExcluded,
    cancellationFee,
    depositRefund,
    totalRefund,
    handleCancel,
  } = bc;

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.container} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Dyn>Loading…</Dyn>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={styles.section}>
        <div className={styles.container} style={{ maxWidth: '36rem' }}>
          <BackLink href={bookingLink}><Dyn>Back to booking</Dyn></BackLink>
          <p style={{ marginTop: '1.2rem', color: 'var(--danger)' }}>{t(error || 'Booking not found.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.container} style={{ maxWidth: '36rem' }}>
        <BackLink href={bookingLink}><Dyn>Back to booking</Dyn></BackLink>

        {!cancelled ? (
          <div className={styles.priceCard} style={{ marginTop: '1.4rem', position: 'static' }}>
            <h1 style={{ fontSize: '1.5rem' }}><Dyn>Cancel this booking?</Dyn></h1>
            <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
              <Dyn>Review the refund breakdown below before confirming. This can&apos;t be undone.</Dyn>
            </p>

            <div style={{ marginTop: '1.4rem', borderRadius: 2, background: 'var(--paper)', border: '1px solid var(--line)', padding: '1.2rem' }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}><Dyn>You&apos;re cancelling</Dyn></div>
              <div style={{ marginTop: '0.4rem', fontSize: '1.05rem', fontWeight: 600 }}>{booking.vehicle.name}</div>
              <div style={{ marginTop: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {booking.pickUp.date} → {booking.dropOff.date}
              </div>
              <div className={styles.priceDivider} />
              <div className={styles.priceLine}>
                <span style={{ color: 'var(--text-muted)' }}><Dyn>Booking total</Dyn></span>
                <b>{money(booking.invoice.total)}</b>
              </div>
              {insuranceExcluded > 0 && (
                <div className={styles.priceLine}>
                  <span style={{ color: 'var(--text-muted)' }}><Dyn>Insurance (non-refundable)</Dyn></span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{money(insuranceExcluded)}</span>
                </div>
              )}
              {cancellationFee > 0 && (
                <div className={styles.priceLine}>
                  <span style={{ color: 'var(--text-muted)' }}><Dyn>Cancellation fee</Dyn></span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{money(cancellationFee)}</span>
                </div>
              )}
              {depositRefund > 0 && (
                <div className={styles.priceLine}>
                  <span style={{ color: 'var(--text-muted)' }}><Dyn>Security deposit</Dyn></span>
                  <span style={{ fontWeight: 600, color: 'var(--brass)' }}>+{money(depositRefund)}</span>
                </div>
              )}
            </div>

            <div className={styles.noticeBox}>
              <span>
                <Dyn>You&apos;ll receive a refund of</Dyn> {money(totalRefund)} <Dyn>to your original payment method.</Dyn>
              </span>
            </div>

            <div style={{ marginTop: '1.6rem' }}>
              <div style={{ marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}><Dyn>Why are you cancelling?</Dyn></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {REASONS.map((r) => {
                  const active = reason === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        borderRadius: 2,
                        border: active ? '1.5px solid var(--brass)' : '1px solid var(--line)',
                        background: active ? 'color-mix(in srgb, var(--brass) 8%, var(--card))' : 'var(--paper)',
                        padding: '0.8rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          flex: 'none',
                          width: 18,
                          height: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          border: active ? 'none' : '1.5px solid var(--line-strong)',
                          background: active ? 'var(--brass)' : 'transparent',
                        }}
                      >
                        {active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--on-brass)' }} />}
                      </span>
                      {t(r)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1.2rem' }}>
              <label style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}><Dyn>Additional notes</Dyn></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Add more details (optional)')}
                rows={3}
                style={{ width: '100%', resize: 'none', borderRadius: 2, border: '1px solid var(--line)', background: 'var(--paper)', padding: '0.65rem 0.9rem', fontSize: '0.85rem', color: 'var(--text)', outline: 'none' }}
              />
            </div>

            {error && <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--danger)' }}>{t(error)}</p>}

            <div className={styles.btnRow}>
              <Link href={bookingLink} className={`${styles.btn} ${styles.btnGhost}`}>
                <Dyn>Keep booking</Dyn>
              </Link>
              <button
                type="button"
                disabled={!reason || cancelling}
                onClick={handleCancel}
                className={`${styles.btn} ${styles.btnDanger}`}
              >
                {cancelling ? t('Cancelling...') : t('Cancel booking')}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.priceCard} style={{ marginTop: '1.4rem', position: 'static', textAlign: 'center' }}>
            <h1 style={{ marginTop: '0.6rem', fontSize: '1.5rem' }}><Dyn>Booking cancelled</Dyn></h1>
            <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
              <Dyn>Your reservation for</Dyn> {booking.vehicle.name} <Dyn>has been cancelled.</Dyn>
            </p>
            <div style={{ margin: '1.4rem auto 0', maxWidth: '22rem', borderRadius: 2, border: '1px solid var(--line)', background: 'var(--paper)', padding: '1rem 1.2rem' }}>
              <div className={styles.priceLine} style={{ margin: 0 }}>
                <span style={{ fontWeight: 600 }}><Dyn>Refund issued</Dyn></span>
                <b>{money(totalRefund)}</b>
              </div>
              <div style={{ marginTop: '0.3rem', textAlign: 'left', fontSize: '0.76rem', color: 'var(--text-muted)' }}><Dyn>Expect it on your original payment method within 5-10 business days.</Dyn></div>
            </div>
            <Link href={bookingLink} className={`${styles.btn} ${styles.btnBrass}`} style={{ marginTop: '1.6rem', display: 'inline-flex' }}>
              <Dyn>View booking</Dyn> →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
