'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { BackLink } from '@/components/ui/back-link';
import { ArrowRight, Check, Swap } from '@/components/ui/icons';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { listFleets } from '@/services/fleetServices';
import { useFleet } from '@/hooks';
import { FleetPagination } from '@/components/fleet/fleet-pagination';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import type { Vehicle } from '@/types/vehicle';
import { paths } from '@/lib/paths';
import { cn, money } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const PAGE_SIZE = 9;

export default function SwapVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [bookingError, setBookingError] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
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
          page,
          page_size: PAGE_SIZE,
          pickup_datetime: booking!.pickUp.rawDatetime,
          dropoff_datetime: booking!.dropOff.rawDatetime,
          exclude_booking: id,
        });
        const filtered = res.results.filter(
          (v) => String(v.id) !== String(booking!.fleetId),
        );
        setVehicles(filtered);
        setTotalCount(res.count - (res.results.length - filtered.length));
      } catch {
        setError('Could not load vehicles.');
      } finally {
        setLoading(false);
      }
    }
    loadFleets();
  }, [booking, id, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
  const { data: newFleet } = useFleet(selected ?? undefined, !!selected);

  const num = (v: any) => (v != null ? parseFloat(v) || 0 : 0);
  const swapFee = num(preview?.modification_fee);
  const refundAmount = num(preview?.refund_amount);
  const additionalCharge = num(preview?.additional_charge);
  const newTotal = preview?.new_total != null ? num(preview.new_total) : null;
  const allowed = preview ? preview.allowed !== false : true;

  const nb = preview?.new_breakdown ?? null;
  const nbBase = nb ? num(nb.base_price) : 0;
  const nbFees = nb ? num(nb.fees) : 0;
  const nbLocation = nb ? num(nb.location_charges) : 0;
  const nbTax = nb ? num(nb.tax) : 0;
  const nbInsurance = nb ? num(nb.insurance) : 0;
  const insuranceRefund = num(preview?.insurance_refund);
  const currentTotal = preview?.original_breakdown?.total != null
    ? num(preview.original_breakdown.total)
    : (booking ? (parseFloat(booking.totalPrice || '0') || booking.invoice.total) : 0);
  const unitLabel = booking?.invoice.items[0]?.unit || 'day';
  const newVehiclePrice = newFleet?.pricePerDay || newFleet?.pricePerHour || selectedVehicle?.pricePerDay || selectedVehicle?.pricePerHour || 0;
  const newVehicleName = newFleet?.name || selectedVehicle?.name || 'New vehicle';
  const newVehicleImage = newFleet?.image || selectedVehicle?.image || '/images/vehicles/car_placeholder.png';

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
        <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-[80px] pb-[120px] text-center">
          <p className="text-[15px] font-semibold text-ink">Booking not found.</p>
          <BackLink href={paths.booking(id)}>Back to booking</BackLink>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
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

        {!loading && totalPages > 1 && (
          <div className="mt-7 flex justify-center">
            <FleetPagination
              page={page}
              totalPages={totalPages}
              onPage={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {selectedVehicle && (
          <div className="mt-8 rounded-2xl border border-card-border bg-subtle p-6">
            <div className="mb-[14px] text-sm font-semibold text-ink">Review your change</div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="flex items-center gap-3">
                <div
                  className="h-[58px] w-[84px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url('${booking?.vehicle.image}')` }}
                />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-faint">Current</div>
                  <div className="text-[14px] font-semibold text-secondary">{booking?.vehicle.name}</div>
                  <div className="text-[12px] text-muted">{money(currentTotal)}</div>
                </div>
              </div>

              <span className="hidden h-9 w-9 items-center justify-center justify-self-center rounded-full bg-white sm:flex">
                <ArrowRight size={16} className="text-primary" />
              </span>

              <div className="flex items-center gap-3">
                <div
                  className="h-[58px] w-[84px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url('${newVehicleImage}')` }}
                />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-primary">New</div>
                  <div className="text-[14px] font-semibold text-secondary">{newVehicleName}</div>
                  <div className="text-[12px] text-muted">
                    {newVehiclePrice ? `${money(newVehiclePrice)}/${newFleet?.pricePerDay || selectedVehicle?.pricePerDay ? 'day' : 'hour'}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {previewLoading ? (
              <p className="mt-5 text-[12.5px] text-faint">Calculating new price...</p>
            ) : preview && !allowed ? (
              <p className="mt-5 text-[12.5px] font-medium text-red-600">{preview.reason || 'This swap is not allowed.'}</p>
            ) : preview && allowed ? (
              <div className="mt-5 space-y-[10px]">
                {nb && (
                  <>
                    <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint">New vehicle breakdown</div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-secondary">Base price</span>
                      <span className="font-medium text-ink">{money(nbBase)}</span>
                    </div>
                    {nbLocation > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary">Location charges</span>
                        <span className="font-medium text-ink">{money(nbLocation)}</span>
                      </div>
                    )}
                    {nbFees > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary">Fees</span>
                        <span className="font-medium text-ink">{money(nbFees)}</span>
                      </div>
                    )}
                    {nbInsurance > 0 && insuranceRefund > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary">Insurance (refundable)</span>
                        <span className="font-medium text-ink">{money(insuranceRefund)}</span>
                      </div>
                    )}
                    {nbTax > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary">Tax</span>
                        <span className="font-medium text-ink">{money(nbTax)}</span>
                      </div>
                    )}
                    {swapFee > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary">Swap fee</span>
                        <span className="font-medium text-ink">+{money(swapFee)}</span>
                      </div>
                    )}
                    {newTotal !== null && (
                      <>
                        <div className="my-1 h-px bg-card-border" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">New total ({unitLabel}s)</span>
                          <span className="text-[17px] font-bold text-ink">{money(newTotal)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="my-1 h-px bg-card-border" />
                {additionalCharge > 0 ? (
                  <div className="flex items-center justify-between rounded-[10px] border border-amber-border bg-amber-bg px-4 py-[13px]">
                    <span className="text-[13px] font-semibold text-amber-text">Additional charge{swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}</span>
                    <span className="text-[15px] font-bold text-amber-text-2">{money(additionalCharge)}</span>
                  </div>
                ) : refundAmount > 0 ? (
                  <div className="flex items-center justify-between rounded-[10px] border border-green-border-2 bg-green-bg px-4 py-[13px]">
                    <span className="text-[13px] font-semibold text-success">Refund due{swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}</span>
                    <span className="text-[15px] font-bold text-success">{money(refundAmount)}</span>
                  </div>
                ) : (
                  <div className="text-[12.5px] text-faint">No additional charge for this swap.</div>
                )}
              </div>
            ) : (
              <p className="mt-5 text-[12.5px] text-faint">Calculating new price...</p>
            )}
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
    </div>
  );
}
