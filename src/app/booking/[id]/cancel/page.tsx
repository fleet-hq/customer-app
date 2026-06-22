'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { BackLink } from '@/components/ui/back-link';
import { ArrowRight, Check, Close, Info } from '@/components/ui/icons';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { paths } from '@/lib/paths';
import { cn, money } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const REASONS = ['Plans changed', 'Found a better option', 'Booked by mistake', 'Other'];

export default function CancelBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (urlToken) setBookingToken(urlToken);
  }, [urlToken]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBookingById(id);
        setBooking(data);

        const res = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: { type: 'cancel' },
        });
        setPreview(res.data);
      } catch {
        setError('Could not load booking details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const bookingLink = `${paths.booking(id)}?token=${urlToken || ''}`;

  const refundAmount = preview?.refund_amount ? parseFloat(preview.refund_amount) : 0;
  const cancellationFee = preview?.modification_fee ? parseFloat(preview.modification_fee) : 0;
  const insuranceExcluded = preview?.insurance_excluded ? parseFloat(preview.insurance_excluded) : 0;

  const handleCancel = async () => {
    if (!reason) {
      setError('Please select a reason for cancellation.');
      return;
    }
    setCancelling(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/api/bookings/public/modify/`,
        {
          type: 'cancel',
          cancellation_reason: `${reason}${notes ? ': ' + notes : ''}`,
        },
        { headers: getBookingTokenHeaders() }
      );
      setCancelled(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.reason || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto flex w-full max-w-[640px] flex-1 items-center justify-center px-6 pt-[22px] pb-16">
          <p className="text-muted">Loading...</p>
        </section>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[640px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={bookingLink}>Back to booking</BackLink>
          <p className="mt-6 text-[13.5px] text-danger">{error || 'Booking not found.'}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[640px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={bookingLink}>Back to booking</BackLink>

        {!cancelled ? (
          <div className="mt-[18px] rounded-2xl border border-card-border bg-white p-6">
            <div className="flex items-start gap-[13px]">
              <span className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-danger-bg">
                <Close size={22} strokeWidth={2.2} className="text-danger" />
              </span>
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Cancel this booking?</h1>
                <p className="mt-1 text-[13px] leading-[1.55] text-muted">
                  Review the refund breakdown below before confirming. This can&apos;t be undone.
                </p>
              </div>
            </div>

            <div className="mt-[22px] rounded-[12px] bg-subtle p-5">
              <div className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">You&apos;re cancelling</div>
              <div className="mt-[6px] text-[16px] font-semibold text-secondary">{booking.vehicle.name}</div>
              <div className="mt-[3px] text-[12.5px] text-muted">
                {booking.pickUp.date} → {booking.dropOff.date}
              </div>
              <div className="my-[14px] h-px bg-card-border" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted">Booking total</span>
                <span className="text-[15px] font-bold text-secondary">{money(booking.invoice.total)}</span>
              </div>
              {insuranceExcluded > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] text-muted">Insurance (non-refundable)</span>
                  <span className="text-[14px] font-semibold text-danger">-{money(insuranceExcluded)}</span>
                </div>
              )}
              {cancellationFee > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] text-muted">Cancellation fee</span>
                  <span className="text-[14px] font-semibold text-danger">-{money(cancellationFee)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-[10px] rounded-[10px] border border-primary-border bg-primary-soft px-[14px] py-[12px]">
              <Info size={15} strokeWidth={2} className="mt-px flex-shrink-0 text-primary" />
              <span className="text-[11.5px] leading-[1.5] text-secondary">
                You&apos;ll receive a refund of {money(refundAmount)} to your original payment method.
              </span>
            </div>

            <div className="mt-6">
              <div className="mb-[10px] text-[13px] font-semibold text-ink">Why are you cancelling?</div>
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
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-[8px] block text-[13px] font-semibold text-ink">Additional notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add more details (optional)"
                rows={3}
                className="w-full resize-none rounded-[10px] border border-line bg-white px-4 py-[11px] text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-primary"
              />
            </div>

            {error && <p className="mt-4 text-[13px] text-danger">{error}</p>}

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={bookingLink}
                className="flex-1 rounded-[10px] border border-line bg-white py-[13px] text-center text-sm font-semibold text-ink"
              >
                Keep booking
              </Link>
              <button
                disabled={!reason || cancelling}
                onClick={handleCancel}
                className={cn(
                  'flex-1 rounded-[10px] py-[13px] text-sm font-bold text-white',
                  reason && !cancelling ? 'bg-danger' : 'cursor-not-allowed bg-locked',
                )}
              >
                {cancelling ? 'Cancelling...' : 'Cancel booking'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-[18px] rounded-2xl border border-card-border bg-white p-8 text-center">
            <span className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-green-bg">
              <Check size={28} strokeWidth={3} className="text-primary" />
            </span>
            <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.01em] text-ink">Booking cancelled</h1>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">
              Your reservation for {booking.vehicle.name} has been cancelled.
            </p>
            <div className="mx-auto mt-6 max-w-[360px] rounded-[12px] border border-green-border-2 bg-green-bg px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-success">Refund issued</span>
                <span className="text-[16px] font-bold text-success">{money(refundAmount)}</span>
              </div>
              <div className="mt-1 text-left text-[11.5px] text-success">Expect it on your original payment method within 5-10 business days.</div>
            </div>
            <Link
              href={bookingLink}
              className="mt-7 inline-flex items-center gap-2 rounded-[10px] bg-primary px-[26px] py-[13px] text-sm font-bold text-white hover:bg-primary-hover"
            >
              View booking <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
