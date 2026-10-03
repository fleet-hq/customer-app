'use client';

import { cn } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { useManageLookup } from './use-manage-lookup';
import ManageClientT2 from './manage-client-t2';

export default function ManageBookingsPage() {
  const {
    tenant,
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
  } = useManageLookup();

  if (tenant.websiteTemplate === 'template_2') {
    return <ManageClientT2 />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink"><Dyn>Manage your booking</Dyn></h1>
          <p className="mx-auto mt-[7px] max-w-[380px] text-[13.5px] leading-[1.55] text-muted">
            <Dyn>Look up your reservation with your booking ID and last name or email — then modify dates, swap vehicles, or view invoices.</Dyn>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 w-full rounded-2xl border border-card-border bg-white p-6"
        >
          {errors.general && (
            <div className="mb-5 rounded-[10px] bg-danger-bg px-4 py-3 text-[13px] text-danger-text">
              {t(errors.general)}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-ink"><Dyn>Booking ID</Dyn></label>
            <div className="mt-2 flex items-center gap-1 rounded-[10px] border border-line bg-white px-3 focus-within:border-primary">
              <span className="shrink-0 select-none text-[13px] font-semibold text-faint">BKG-</span>
              {/* ``flex-1 min-w-0`` lets the input share space with the
                  fixed prefix instead of forcing 100% width, which used
                  to push the "BKG-" out of the rounded border. */}
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value.replace(/^BKG\s*-?\s*/i, ''))}
                placeholder={t('Enter your booking number')}
                className="flex-1 min-w-0 bg-transparent py-[10px] text-[13px] text-ink placeholder:text-faint focus:outline-none"
              />
            </div>
            {errors.booking_id && <p className="mt-1 text-[11px] text-danger-text">{t(errors.booking_id)}</p>}
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-ink"><Dyn>Last name on driver&apos;s license</Dyn></label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t('Enter your last name')}
              className={cn(
                'mt-2 w-full rounded-[10px] border bg-white px-3 py-[10px] text-[13px] text-ink placeholder:text-faint focus:outline-none focus:border-primary',
                errors.last_name ? 'border-danger-text' : 'border-line',
              )}
            />
            {errors.last_name && <p className="mt-1 text-[11px] text-danger-text">{t(errors.last_name)}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-ink"><Dyn>Email address</Dyn></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Enter your email address')}
              className={cn(
                'mt-2 w-full rounded-[10px] border bg-white px-3 py-[10px] text-[13px] text-ink placeholder:text-faint focus:outline-none focus:border-primary',
                errors.email ? 'border-danger-text' : 'border-line',
              )}
            />
            {errors.email && <p className="mt-1 text-[11px] text-danger-text">{t(errors.email)}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[10px] bg-primary py-[12px] text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {isLoading ? t('Looking up…') : t('Continue')}
          </button>
        </form>
      </section>
    </div>
  );
}
