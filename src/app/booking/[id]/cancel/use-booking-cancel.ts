'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { paths } from '@/lib/paths';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const REASONS = ['Plans changed', 'Found a better option', 'Booked by mistake', 'Other'];

/** All booking-cancellation data, state, and handlers — shared verbatim
 *  by both templates' cancel pages so this refund-calculation and
 *  booking-mutation logic lives in exactly one place. Templates differ
 *  only in how they render what this returns. This is a pure mechanical
 *  extraction of what used to be inline in page.tsx — nothing about the
 *  logic itself has changed. */
export function useBookingCancel(id: string) {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  const tenant = useTenant();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const { t } = useDynamicTranslation([
    'Add more details (optional)',
    'Plans changed',
    'Found a better option',
    'Booked by mistake',
    'Other',
    'Cancelling...',
    'Cancel booking',
    'Could not load booking details.',
    'Please select a reason for cancellation.',
    'Failed to cancel booking.',
    'Booking not found.',
  ]);

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
  const depositRefund = preview?.deposit_refund ? parseFloat(preview.deposit_refund) : 0;
  const totalRefund = refundAmount + depositRefund;

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

  return {
    tenant,
    id,
    booking,
    preview,
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
    refundAmount,
    cancellationFee,
    insuranceExcluded,
    depositRefund,
    totalRefund,
    handleCancel,
  };
}
