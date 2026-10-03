'use client';

import { BackLink } from '@/components/ui/back-link';
import { Field, TextInput } from '@/components/ui/field';
import { Dropzone, ReassuranceStrip } from '@/components/booking/verify-bits';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useVerifyInsurance } from './use-verify-insurance';
import styles from '@/styles/template-2.module.css';

function OptionCardT2({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        cursor: 'pointer',
        alignItems: 'center',
        gap: '0.8rem',
        borderRadius: 3,
        padding: '1rem',
        border: selected ? '1.5px solid var(--brass)' : '1px solid var(--line)',
        background: selected ? 'color-mix(in srgb, var(--brass) 8%, var(--card))' : 'var(--paper)',
      }}
    >
      <span
        style={{
          display: 'flex',
          flex: 'none',
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: selected ? '6px solid var(--brass)' : '1.5px solid var(--line-strong)',
          background: selected ? 'var(--brass)' : 'var(--paper)',
        }}
      >
        {selected && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--on-brass)' }} />}
      </span>
      {children}
    </div>
  );
}

export default function VerifyInsuranceClientT2() {
  const {
    tokenReady,
    isLoading,
    isError,
    booking,
    mode,
    setMode,
    provider,
    setProvider,
    policy,
    setPolicy,
    proof,
    setProof,
    error,
    sent,
    useOwn,
    t,
    bookingHref,
    submit,
    pending,
  } = useVerifyInsurance();

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

  if (sent) {
    return (
      <div className={styles.section}>
        <div className={styles.container} style={{ maxWidth: '36rem', textAlign: 'center' }}>
          <BackLink href={bookingHref}><Dyn>Back to booking</Dyn></BackLink>
          <h1 style={{ marginTop: '2.5rem' }}><Dyn>Check your email</Dyn></h1>
          <p style={{ marginTop: '0.6rem', color: 'var(--text-muted)' }}>
            <Dyn>We&apos;ve emailed you a secure link to verify your insurance. Follow it to finish, then return to your booking.</Dyn>
          </p>
          <a href={bookingHref} className={`${styles.btn} ${styles.btnBrass}`} style={{ marginTop: '1.6rem', display: 'inline-flex' }}>
            <Dyn>Back to booking</Dyn>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.container} style={{ maxWidth: '36rem' }}>
        <BackLink href={bookingHref}><Dyn>Back to booking</Dyn></BackLink>

        <div style={{ marginTop: '1rem' }}>
          <h1><Dyn>Verify your insurance</Dyn></h1>
          <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
            <Dyn>Confirm the protection you selected, or add your own coverage details.</Dyn>
          </p>
        </div>

        <div style={{ marginTop: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <OptionCardT2 selected={!useOwn} onClick={() => setMode('plan')}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}><Dyn>Use Standard Protection</Dyn></div>
              <div style={{ marginTop: '0.15rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <Dyn>The plan you selected at checkout — $29.99/day. Nothing else to upload.</Dyn>
              </div>
            </div>
            <span style={{ borderRadius: 20, padding: '0.2rem 0.55rem', fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap', background: 'color-mix(in srgb, var(--brass) 14%, var(--card))', color: 'var(--brass)' }}>
              <Dyn>Recommended</Dyn>
            </span>
          </OptionCardT2>

          <OptionCardT2 selected={useOwn} onClick={() => setMode('own')}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}><Dyn>I&apos;ll use my own coverage</Dyn></div>
              <div style={{ marginTop: '0.15rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}><Dyn>Add your provider details and proof of active coverage.</Dyn></div>
            </div>
          </OptionCardT2>
        </div>

        {useOwn && (
          <div className={styles.priceCard} style={{ marginTop: '1rem', position: 'static' }}>
            <div className={styles.formGrid}>
              <Field label={t('Insurance provider')}>
                <TextInput value={provider} onChange={(e) => setProvider(e.target.value)} placeholder={t('e.g. GEICO')} />
              </Field>
              <Field label={t('Policy number')}>
                <TextInput value={policy} onChange={(e) => setPolicy(e.target.value)} placeholder={t('e.g. 9921-AC-77')} />
              </Field>
            </div>
            <label style={{ marginTop: '1rem', marginBottom: '0.6rem', display: 'block', fontSize: '0.76rem', fontWeight: 500 }}><Dyn>Proof of coverage</Dyn></label>
            <Dropzone added={proof} onClick={() => setProof(true)} caption={t('PDF or photo of your insurance card')} label={t('File added')} />
          </div>
        )}

        <ReassuranceStrip text={t('Your coverage details are encrypted and used only to verify your booking.')} />

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
            {pending ? t('Sending…') : useOwn ? t('Submit for verification') : t('Confirm protection')}
          </button>
        </div>
      </div>
    </div>
  );
}
