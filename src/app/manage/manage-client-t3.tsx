'use client';

import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';
import { useManageLookup } from './use-manage-lookup';

/** Template-3 booking lookup — the raw template's own `mg` / `mg-card`
 *  / `lfield` markup, where the label sits inside the bordered field
 *  rather than above it.
 *
 *  All state and submission come from useManageLookup, the hook
 *  template 2's version uses, so the two differ only in appearance. */
export default function ManageClientT3() {
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
    <main className="pg">
      <div className="wrap">
        <div className="mg">
          <Link className="crumb" href={paths.home}>
            ‹ <Dyn>Home</Dyn>
          </Link>
          <h1>
            <Dyn>Manage your booking</Dyn>
          </h1>
          <p>
            <Dyn>
              Look up your reservation with your booking ID and last name or email, then
              modify dates, swap vehicles or view invoices.
            </Dyn>
          </p>

          <form className="mg-card" onSubmit={handleSubmit} noValidate>
            {linkSent ? (
              <p className="note">
                <Dyn>If that email has bookings with us, a sign-in link is on its way. It works for 5 days.</Dyn>
              </p>
            ) : null}

            {mode === 'details' ? (
            <>
            <div className="lfield">
              <label htmlFor="t3-bid">
                <Dyn>Booking ID</Dyn>
              </label>
              <div className="ph-row">
                <span>BKG-</span>
                <input
                  id="t3-bid"
                  inputMode="numeric"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.replace(/^BKG\s*-?\s*/i, ''))}
                  placeholder={t('Enter your booking number')}
                />
              </div>
            </div>
            {errors.booking_id ? <p className="mg-err on">{t(errors.booking_id)}</p> : null}

            <div className="lfield">
              <label htmlFor="t3-lnm">
                <Dyn>Last name on driver&apos;s license</Dyn>
              </label>
              <input
                id="t3-lnm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('Enter your last name')}
                autoComplete="family-name"
              />
            </div>
            {errors.last_name ? <p className="mg-err on">{t(errors.last_name)}</p> : null}
            </>
            ) : null}

            <div className="lfield">
              <label htmlFor="t3-eml">
                <Dyn>Email address</Dyn>
              </label>
              <input
                id="t3-eml"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('Enter your email address')}
                autoComplete="email"
              />
            </div>
            {errors.email ? <p className="mg-err on">{t(errors.email)}</p> : null}

            {errors.general ? <p className="mg-err on">{t(errors.general)}</p> : null}

            <button className="btn" type="submit" disabled={isLoading}>
              {mode === 'link'
                ? isLoading ? t('Sending…') : t('Send me a sign-in link')
                : isLoading ? t('Looking up…') : t('Continue')}{' '}
              <span className="chev">›</span>
            </button>

            <button type="button" className="crumb mg-switch" onClick={() => switchMode(mode === 'details' ? 'link' : 'details')}>
              <Dyn>{mode === 'details' ? 'No booking ID? Email me a sign-in link' : 'Look up with my booking ID instead'}</Dyn>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
