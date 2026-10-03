'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { listFleets } from '@/services/fleetServices';
import { useFleet } from '@/hooks';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import type { Vehicle } from '@/types/vehicle';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const PAGE_SIZE = 9;

/** All vehicle-swap data, state, and handlers — shared verbatim by both
 *  templates' swap pages so this pricing/booking-mutation logic lives in
 *  exactly one place. Templates differ only in how they render what this
 *  returns. This is a pure mechanical extraction of what used to be
 *  inline in page.tsx — nothing about the logic itself has changed. */
export function useVehicleSwap(id: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  const tenant = useTenant();

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
  const { t } = useDynamicTranslation([
    'This swap is not allowed.',
    'No change',
    'refund',
    'seats',
    'Processing...',
    'Confirm change',
    'Could not load vehicles.',
    'Failed to swap vehicle.',
  ]);

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
  // Moving to a vehicle with a bigger security deposit collects the
  // difference at this checkout. It is refundable rather than a price
  // rise, so it is shown on its own line — but it IS charged, and the
  // renter has to see the total before agreeing: booking 798 was
  // quoted 518.00 and charged 968.00 when this was left out.
  const depositTopup = num(preview?.deposit_topup);
  const totalDueNow =
    preview?.total_due_now != null
      ? num(preview.total_due_now)
      : additionalCharge + depositTopup;
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
  const newVehicleImage = newFleet?.image || selectedVehicle?.image || '/images/vehicles/car_placeholder.svg';

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

  return {
    tenant,
    id,
    urlToken,
    router,
    booking,
    bookingError,
    vehicles,
    totalCount,
    page,
    setPage,
    loading,
    selected,
    setSelected,
    preview,
    previewLoading,
    error,
    confirming,
    t,
    totalPages,
    selectedVehicle,
    newFleet,
    swapFee,
    refundAmount,
    additionalCharge,
    depositTopup,
    totalDueNow,
    newTotal,
    allowed,
    nb,
    nbBase,
    nbFees,
    nbLocation,
    nbTax,
    nbInsurance,
    insuranceRefund,
    currentTotal,
    unitLabel,
    newVehiclePrice,
    newVehicleName,
    newVehicleImage,
    handleConfirm,
    cancelHref,
  };
}
