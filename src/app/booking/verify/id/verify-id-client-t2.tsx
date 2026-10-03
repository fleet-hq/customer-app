'use client';

import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { Dropzone, ReassuranceStrip } from '@/components/booking/verify-bits';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useVerifyId } from './use-verify-id';
import styles from '@/styles/template-2.module.css';

export default function VerifyIdClientT2() {
  const {
    tokenReady,
    isLoading,
    isError,
    booking,
    bookingHref,
    license,
    setLicense,
    dob,
    setDob,
    issuingState,
    setIssuingState,
    front,
    setFront,
    back,
    setBack,
    error,
    pending,
    t,
    submit,
  } = useVerifyId();

  if (!tokenReady || isLoading) {
    return (
      <div className={styles.section}>
        <div className={styles.container} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Dyn>Loading booking…</Dyn>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className={styles.section}>
        <div className={styles.container} style={{ maxWidth: '36rem' }}>
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
      <div className={styles.container} style={{ maxWidth: '36rem' }}>
        <BackLink href={bookingHref}><Dyn>Back to booking</Dyn></BackLink>

        <div style={{ marginTop: '1rem' }}>
          <h1><Dyn>Verify your identity</Dyn></h1>
          <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
            <Dyn>Add your driver&apos;s license details. This usually verifies within a minute.</Dyn>
          </p>
        </div>

        <div className={styles.priceCard} style={{ marginTop: '1.4rem', position: 'static' }}>
          <label style={{ marginBottom: '0.6rem', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}><Dyn>Driver&apos;s license photo</Dyn></label>
          <div style={{ marginBottom: '1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
            <Dropzone added={front} onClick={() => setFront(true)} caption={t('Front of license')} />
            <Dropzone added={back} onClick={() => setBack(true)} caption={t('Back of license')} />
          </div>

          <div className={styles.formGrid}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label={t('License number')}>
                <TextInput value={license} onChange={(e) => setLicense(e.target.value)} placeholder={t('e.g. D1234-5678-9012')} />
              </Field>
            </div>
            <Field label={t('Date of birth')}>
              <TextInput value={dob} onChange={(e) => setDob(e.target.value)} placeholder={t('MM / DD / YYYY')} />
            </Field>
            <Field label={t('Issuing state')}>
              <TextInput value={issuingState} onChange={(e) => setIssuingState(e.target.value)} placeholder={t('e.g. Connecticut')} />
            </Field>
          </div>

          <ReassuranceStrip text={t('Your documents are encrypted and used only to verify your booking.')} />
        </div>

        {error && (
          <p className={styles.noticeBoxDanger} style={{ marginTop: '1rem' }}>{t(error)}</p>
        )}

        <div style={{ marginTop: '1.4rem', display: 'flex', gap: '0.8rem' }}>
          <a href={bookingHref} className={`${styles.btn} ${styles.btnGhost}`}>
            <Dyn>Cancel</Dyn>
          </a>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className={`${styles.btn} ${styles.btnBrass}`}
            style={{ flex: 1, justifyContent: 'center', opacity: pending ? 0.6 : 1 }}
          >
            {pending ? t('Redirecting…') : t('Submit for verification')}
          </button>
        </div>
      </div>
    </div>
  );
}
