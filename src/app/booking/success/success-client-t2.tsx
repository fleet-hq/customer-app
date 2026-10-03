'use client';

import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useBookingSuccess } from './use-booking-success';
import styles from '@/styles/template-2.module.css';

export default function BookingSuccessClientT2() {
  const { phase, errorMessage, t, router } = useBookingSuccess();

  return (
    <div className={styles.section} style={{ display: 'flex', alignItems: 'center', minHeight: '80vh' }}>
      <div className={styles.container} style={{ maxWidth: '28rem', textAlign: 'center' }}>
        {phase !== 'error' ? (
          <>
            <div style={{ marginBottom: '1.4rem', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '2px solid var(--line-strong)',
                  borderTopColor: 'var(--brass)',
                  animation: 't2Spin 0.8s linear infinite',
                }}
              />
            </div>
            <h1>
              {phase === 'processing' ? t('Finalising your booking…') : t('Confirming payment…')}
            </h1>
            <p style={{ marginTop: '0.6rem', color: 'var(--text-muted)' }}>
              {phase === 'processing'
                ? t('Stripe is processing your payment. This usually takes just a moment.')
                : t('One second while we set up your reservation.')}
            </p>
          </>
        ) : (
          <>
            <h1><Dyn>Something went wrong</Dyn></h1>
            <p style={{ marginTop: '0.6rem', marginBottom: '1.4rem', color: 'var(--text-muted)' }}>{t(errorMessage)}</p>
            <button type="button" onClick={() => router.replace(paths.home)} className={`${styles.btn} ${styles.btnBrass}`}>
              <Dyn>Back to home</Dyn>
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes t2Spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
