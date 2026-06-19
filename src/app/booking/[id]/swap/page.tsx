'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { ArrowRight, Check, Swap } from '@/components/ui/icons';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { listFleets } from '@/services/fleetServices';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import type { Vehicle } from '@/types/vehicle';
import { paths } from '@/lib/paths';
import { cn, money } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function SwapVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [bookingError, setBookingError] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (urlToken) setBookingToken(urlToken);
  }, [urlToken]);

  useEffect(() => {
    async function loadBooking() {
      try {
        const data = await getBookingById(id);
        setBooking(data);
      } catch {
        setBookingError(true);
      }
    }
    loadBooking();
  }, [id]);

  useEffect(() => {
    if (!booking) return;
    async function loadFleets() {
      setLoading(true);
      setError('');
      try {
        const res = await listFleets({
          page: 1,
          page_size: 50,
          pickup_datetime: booking!.pickUp.rawDatetime,
          dropoff_datetime: booking!.dropOff.rawDatetime,
          exclude_booking: id,
        });
        const filtered = res.results.filter(
          (v) => String(v.id) !== String(booking!.fleetId),
        );
        setVehicles(filtered);
      } catch {
        setError('Could not load vehicles.');
      } finally {
        setLoading(false);
      }
    }
    loadFleets();
  }, [booking, id]);

  useEffect(() => {
    if (!selected || !booking) {
      setPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: { type: 'swap', new_fleet_id: selected },
        });
        setPreview(res.data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selected, booking]);

  const selectedVehicle = vehicles.find((v) => String(v.id) === selected) ?? null;

  const priceDiff = preview?.price_difference ? parseFloat(preview.price_difference) : 0;
  const swapFee = preview?.modification_fee ? parseFloat(preview.modification_fee) : 0;
  const refundAmount = preview?.refund_amount ? parseFloat(preview.refund_amount) : 0;
  const additionalCharge = preview?.additional_charge ? parseFloat(preview.additional_charge) : 0;
  const allowed = preview ? preview.allowed !== false : true;

  const handleConfirm = async () => {
    if (!selected || !booking) return;
    setConfirming(true);
    setError('');
    try {
      const successUrl = `${window.location.origin}/booking/${id}?token=${urlToken || ''}`;
      const cancelUrl = `${window.location.origin}/booking/${id}/swap?token=${urlToken || ''}`;
      const res = await axios.post(
        `${API_URL}/api/bookings/public/modify/`,
        {
          type: 'swap',
          new_fleet_id: selected,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        { headers: getBookingTokenHeaders() },
      );
      if (res.data.status === 'checkout_required' && res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        router.push(`/booking/${id}?token=${urlToken || ''}`);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.reason ||
          'Failed to swap vehicle.',
      );
      setConfirming(false);
    }
  };

  const cancelHref = `/booking/${id}?token=${urlToken || ''}`;

  if (bookingError) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <Header />
        <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-[80px] pb-[120px] text-center">
          <p className="text-[15px] font-semibold text-ink">Booking not found.</p>
          <BackLink href={paths.booking(id)}>Back to booking</BackLink>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-[22px] pb-[120px]">
        <BackLink href={cancelHref}>Back to booking</BackLink>

        <h1 className="mt-[14px] text-2xl font-semibold tracking-[-0.01em] text-ink">Change your vehicle</h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          Pick a different vehicle for the same dates. Any price difference is shown before you confirm.
        </p>

        {booking && (
          <div className="mt-[22px] flex items-center gap-4 rounded-2xl border-[1.5px] border-primary bg-primary-soft px-[22px] py-5">
            <div
              className="h-[70px] w-[100px] flex-shrink-0 rounded-[11px] bg-cover bg-center"
              style={{ backgroundImage: `url('${booking.vehicle.image}')` }}
            />
            <div className="flex-1">
              <div className="text-[10px] font-semibold tracking-[0.06em] text-primary uppercase">Current vehicle</div>
              <div className="my-[3px] text-[17px] font-semibold text-secondary">{booking.vehicle.name}</div>
              <div className="text-[12.5px] text-muted">
                {booking.vehicle.licensePlate}
                {booking.invoice.items[0]?.pricePerDay
                  ? ` · ${money(booking.invoice.items[0].pricePerDay)}/${booking.invoice.items[0].unit || 'day'}`
                  : ''}
              </div>
            </div>
            <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white min-[560px]:flex">
              <Swap size={18} className="text-primary" />
            </span>
          </div>
        )}

        <div className="mt-[26px] mb-[14px] text-[15px] font-semibold text-ink">Available vehicles</div>
        {loading ? (
          <p className="py-12 text-center text-[13px] text-muted">Loading vehicles...</p>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-chip-2 px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">No other vehicles available for swap right now.</p>
            <p className="mt-1 text-[12.5px] text-muted">
              Please check back later or contact support if you need a specific change.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => {
              const vid = String(v.id);
              const isSelected = selected === vid;
              const image = v.image || '/images/vehicles/car_placeholder.png';
              const unitPrice = v.pricePerDay || v.pricePerHour || 0;
              return (
                <button
                  key={vid}
                  onClick={() => setSelected(vid)}
                  className={cn(
                    'flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-colors',
                    isSelected ? 'border-[1.5px] border-primary bg-primary-soft' : 'border-card-border hover:border-primary',
                  )}
                >
                  <div className="relative h-[140px] w-full bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }}>
                    {v.vehicleType && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-[10px] py-[4px] text-[10px] font-semibold text-secondary">
                        {v.vehicleType}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute right-3 top-3 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary">
                        <Check size={15} strokeWidth={3} className="text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-[18px]">
                    <div className="text-[15px] font-semibold text-secondary">{v.name}</div>
                    <div className="mt-[3px] text-[11.5px] text-faint">
                      {v.year ? `${v.year}` : ''}
                      {v.seats ? `${v.year ? ' · ' : ''}${v.seats} seats` : ''}
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[17px] font-bold text-secondary">
                          {money(unitPrice)}
                          <span className="text-[11px] font-medium text-faint">/{v.pricePerDay ? 'day' : 'hour'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-4 px-6 py-[14px]">
          <div className="min-w-[180px] flex-1">
            {error ? (
              <div className="text-[12.5px] font-medium text-red-500">{error}</div>
            ) : previewLoading ? (
              <div className="text-[12.5px] text-faint">Calculating...</div>
            ) : selectedVehicle && preview && !allowed ? (
              <div className="text-[12.5px] font-medium text-red-500">{preview.reason || 'This swap is not allowed.'}</div>
            ) : selectedVehicle && preview ? (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold text-ink">{selectedVehicle.name}</span>
                <span
                  className={cn(
                    'rounded-full px-[9px] py-[3px] text-[11px] font-semibold',
                    additionalCharge > 0
                      ? 'bg-amber-bg text-amber-text-2'
                      : refundAmount > 0
                        ? 'bg-green-bg-2 text-success'
                        : 'bg-chip-2 text-muted',
                  )}
                >
                  {additionalCharge > 0
                    ? `+${money(additionalCharge)}`
                    : refundAmount > 0
                      ? `−${money(refundAmount)} refund`
                      : 'No change'}
                  {swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}
                </span>
              </div>
            ) : (
              <div className="text-[12.5px] text-faint">Select a vehicle to continue.</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(cancelHref)}
              className="rounded-[10px] border border-line bg-white px-[22px] py-[12px] text-sm font-semibold text-ink"
            >
              Cancel
            </button>
            <button
              disabled={!selectedVehicle || previewLoading || !allowed || confirming}
              onClick={handleConfirm}
              className={cn(
                'inline-flex items-center gap-2 rounded-[10px] px-[24px] py-[12px] text-sm font-bold text-white',
                selectedVehicle && allowed && !previewLoading && !confirming
                  ? 'bg-primary hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-locked',
              )}
            >
              {confirming ? 'Processing...' : 'Confirm change'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
