'use client';

import { Dyn } from '@/components/i18n/Dyn';
import { useManageLookup } from './use-manage-lookup';
import styles from '@/styles/template-2.module.css';

export default function ManageClientT2() {
  const {
    t,
    bookingId,
    setBookingId,
    lastName,
    setLastName,
    email,
    setEmail,
    errors,
    isLoading,
    handleSubmit,
    mode,
    switchMode,
    linkSent,
  } = useManageLookup();

  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <div className={styles.lookupWrap}>
          <div className={styles.lookupHead}>
            <h1><Dyn>Manage your booking</Dyn></h1>
            <p>
              <Dyn>Look up your reservation with your booking ID and last name or email — then modify dates, swap vehicles, or view invoices.</Dyn>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.lookupCard}>
            {errors.general ? (
              <div className={`${styles.noticeBox} ${styles.noticeBoxDanger}`}>{t(errors.general)}</div>
            ) : null}

            {linkSent ? (
              <div className={`${styles.noticeBox} ${styles.noticeBoxSuccess}`}><Dyn>If that email has bookings with us, a sign-in link is on its way. It works for 5 days.</Dyn></div>
            ) : null}

            {mode === 'details' ? (
            <>
            <div className={styles.field}>
              <label className={styles.fieldLabel}><Dyn>Booking ID</Dyn></label>
              <div className={styles.fieldAffixWrap}>
                <span className={styles.fieldAffix}>BKG-</span>
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.replace(/^BKG\s*-?\s*/i, ''))}
                  placeholder={t('Enter your booking number')}
                  className={styles.fieldAffixInput}
                />
              </div>
              {errors.booking_id ? <p className={styles.fieldError}>{t(errors.booking_id)}</p> : null}
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}><Dyn>Last name on driver&apos;s license</Dyn></label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('Enter your last name')}
                className={styles.fieldInput}
              />
              {errors.last_name ? <p className={styles.fieldError}>{t(errors.last_name)}</p> : null}
            </div>
            </>
            ) : null}

            <div className={styles.field}>
              <label className={styles.fieldLabel}><Dyn>Email address</Dyn></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('Enter your email address')}
                className={styles.fieldInput}
              />
              {errors.email ? <p className={styles.fieldError}>{t(errors.email)}</p> : null}
            </div>

            <button type="submit" disabled={isLoading} className={`${styles.btn} ${styles.btnBrass} ${styles.lookupSubmit}`}>
              {mode === 'link'
                ? isLoading ? t('Sending…') : t('Send me a sign-in link')
                : isLoading ? t('Looking up…') : t('Continue')}
            </button>

            <button
              type="button"
              onClick={() => switchMode(mode === 'details' ? 'link' : 'details')}
              className={`${styles.linkMore} ${styles.lookupSwitch}`}
            >
              <Dyn>{mode === 'details' ? 'No booking ID? Email me a sign-in link' : 'Look up with my booking ID instead'}</Dyn>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
