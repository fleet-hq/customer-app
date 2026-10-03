'use client';

import { use } from 'react';
import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';
import { PageLoading } from '@/components/ui/page-loading';
import { ArrowRight, Check, Close, Info } from '@/components/ui/icons';
import { cn, money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { useBookingCancel, REASONS } from './use-booking-cancel';
import CancelBookingClientT2 from './cancel-client-t2';

export default function CancelBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const bc = useBookingCancel(id);

  if (bc.tenant.websiteTemplate === 'template_2') {
    return <CancelBookingClientT2 id={id} />;
  }

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
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <PageLoading />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[640px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={bookingLink}><Dyn>Back to booking</Dyn></BackLink>
          <p className="mt-6 text-[13.5px] text-danger">{t(error || 'Booking not found.')}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[640px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={bookingLink}><Dyn>Back to booking</Dyn></BackLink>

        {!cancelled ? (
          <div className="mt-[18px] rounded-2xl border border-card-border bg-white p-6">
            <div className="flex items-start gap-[13px]">
              <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-danger-bg">
                <Close size={22} strokeWidth={2.2} className="text-danger" />
              </span>
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink"><Dyn>Cancel this booking?</Dyn></h1>
                <p className="mt-1 text-[13px] leading-[1.55] text-muted">
                  <Dyn>Review the refund breakdown below before confirming. This can&apos;t be undone.</Dyn>
                </p>
              </div>
            </div>

            <div className="mt-[22px] rounded-[12px] bg-subtle p-5">
              <div className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase"><Dyn>You&apos;re cancelling</Dyn></div>
              <div className="mt-[6px] text-[16px] font-semibold text-secondary">{booking.vehicle.name}</div>
              <div className="mt-[3px] text-[12.5px] text-muted">
                {booking.pickUp.date} → {booking.dropOff.date}
              </div>
              <div className="my-[14px] h-px bg-card-border" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted"><Dyn>Booking total</Dyn></span>
                <span className="text-[15px] font-bold text-secondary">{money(booking.invoice.total)}</span>
              </div>
              {insuranceExcluded > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] text-muted"><Dyn>Insurance (non-refundable)</Dyn></span>
                  <span className="text-[14px] font-semibold text-danger">-{money(insuranceExcluded)}</span>
                </div>
              )}
              {cancellationFee > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] text-muted"><Dyn>Cancellation fee</Dyn></span>
                  <span className="text-[14px] font-semibold text-danger">-{money(cancellationFee)}</span>
                </div>
              )}
              {depositRefund > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] text-muted"><Dyn>Security deposit</Dyn></span>
                  <span className="text-[14px] font-semibold text-success">+{money(depositRefund)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-[10px] rounded-[10px] border border-primary-border bg-primary-soft px-[14px] py-[12px]">
              <Info size={15} strokeWidth={2} className="mt-px flex-shrink-0 text-primary" />
              <span className="text-[11.5px] leading-[1.5] text-secondary">
                <Dyn>You&apos;ll receive a refund of</Dyn> {money(totalRefund)} <Dyn>to your original payment method.</Dyn>
              </span>
            </div>

            <div className="mt-6">
              <div className="mb-[10px] text-[13px] font-semibold text-ink"><Dyn>Why are you cancelling?</Dyn></div>
              <div className="flex flex-col gap-[10px]">
                {REASONS.map((r) => {
                  const active = reason === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={cn(
                        'flex items-center gap-[12px] rounded-[10px] border px-4 py-[13px] text-left text-[13.5px] font-medium transition-colors',
                        active ? 'border-[1.5px] border-primary bg-primary-soft text-secondary' : 'border-line bg-white text-ink hover:border-primary',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px]',
                          active ? 'border-primary bg-primary' : 'border-control',
                        )}
                      >
                        {active && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
                      </span>
                      {t(r)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-[8px] block text-[13px] font-semibold text-ink"><Dyn>Additional notes</Dyn></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Add more details (optional)')}
                rows={3}
                className="w-full resize-none rounded-[10px] border border-line bg-white px-4 py-[11px] text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-primary"
              />
            </div>

            {error && <p className="mt-4 text-[13px] text-danger">{t(error)}</p>}

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={bookingLink}
                className="flex-1 rounded-[10px] border border-line bg-white py-[13px] text-center text-sm font-semibold text-ink"
              >
                <Dyn>Keep booking</Dyn>
              </Link>
              <button
                disabled={!reason || cancelling}
                onClick={handleCancel}
                className={cn(
                  'flex-1 rounded-[10px] py-[13px] text-sm font-bold text-white',
                  reason && !cancelling ? 'bg-danger' : 'cursor-not-allowed bg-locked',
                )}
              >
                {cancelling ? t('Cancelling...') : t('Cancel booking')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-[18px] rounded-2xl border border-card-border bg-white p-8 text-center">
            <span className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-green-bg">
              <Check size={28} strokeWidth={3} className="text-primary" />
            </span>
            <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.01em] text-ink"><Dyn>Booking cancelled</Dyn></h1>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">
              <Dyn>Your reservation for</Dyn> {booking.vehicle.name} <Dyn>has been cancelled.</Dyn>
            </p>
            <div className="mx-auto mt-6 max-w-[360px] rounded-[12px] border border-green-border-2 bg-green-bg px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-success"><Dyn>Refund issued</Dyn></span>
                <span className="text-[16px] font-bold text-success">{money(totalRefund)}</span>
              </div>
              <div className="mt-1 text-left text-[11.5px] text-success"><Dyn>Expect it on your original payment method within 5-10 business days.</Dyn></div>
            </div>
            <Link
              href={bookingLink}
              className="mt-7 inline-flex items-center gap-2 rounded-[10px] bg-primary px-[26px] py-[13px] text-sm font-bold text-white hover:bg-primary-hover"
            >
              <Dyn>View booking</Dyn> <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
