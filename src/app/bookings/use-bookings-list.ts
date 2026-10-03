'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';
import { setBookingToken } from '@/utils/booking-token';
import type { BookingLookupResponse, LookupBookingItem } from '@/services/bookingServices';

const LOOKUP_STORAGE_KEY = 'cc_lookup';

export const STATUS_META: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  confirmed: { label: 'Confirmed', tone: 'success' },
  reserved: { label: 'Reserved', tone: 'info' },
  pending: { label: 'Pending', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  completed: { label: 'Completed', tone: 'success' },
  paid: { label: 'Paid', tone: 'success' },
  succeeded: { label: 'Paid', tone: 'success' },
  unpaid: { label: 'Unpaid', tone: 'warning' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
};

export const STATUS_LABELS = Array.from(
  new Set(Object.values(STATUS_META).map((m) => m.label)),
);

export function statusMeta(status: string) {
  const key = (status || '').toLowerCase();
  return STATUS_META[key] ?? { label: status, tone: 'neutral' as const };
}

/** Booking-list lookup-result state shared by both templates' "my
 *  bookings" pages so this booking-adjacent logic lives in exactly
 *  one place. Templates differ only in how they render what this
 *  returns. */
export function useBookingsList() {
  const tenant = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = Number(searchParams.get('highlight'));
  const [data, setData] = useState<BookingLookupResponse | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(LOOKUP_STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored) as BookingLookupResponse);
      } catch {
        sessionStorage.removeItem(LOOKUP_STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  function openBooking(booking: LookupBookingItem) {
    if (!data) return;
    setBookingToken(data.booking_token);
    router.push(`${paths.booking(String(booking.id))}?token=${data.booking_token}`);
  }

  const bookings = data?.bookings ?? [];

  return {
    tenant,
    highlightId,
    data,
    ready,
    bookings,
    openBooking,
  };
}
