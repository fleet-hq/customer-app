'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { DEMO_USER } from '@/lib/mock-data';
import { paths } from '@/lib/paths';
import { formatShortDate, formatTime } from '@/utils/format-date';
import { setBookingToken } from '@/utils/booking-token';
import type { BookingLookupResponse, LookupBookingItem } from '@/services/bookingServices';

const LOOKUP_STORAGE_KEY = 'cc_lookup';
const PLACEHOLDER_IMAGE = '/images/car-cherokee.png';

const STATUS_META: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-green-bg-2 text-success' },
  pending: { label: 'Pending', className: 'bg-amber-bg text-amber-text-2' },
  cancelled: { label: 'Cancelled', className: 'bg-danger-bg text-danger-text' },
  completed: { label: 'Completed', className: 'bg-green-bg-2 text-success' },
  paid: { label: 'Paid', className: 'bg-green-bg-2 text-success' },
  succeeded: { label: 'Paid', className: 'bg-green-bg-2 text-success' },
  unpaid: { label: 'Unpaid', className: 'bg-amber-bg text-amber-text-2' },
  refunded: { label: 'Refunded', className: 'bg-subtle text-muted' },
  failed: { label: 'Failed', className: 'bg-danger-bg text-danger-text' },
};

function statusMeta(status: string) {
  const key = (status || '').toLowerCase();
  return STATUS_META[key] ?? { label: status, className: 'bg-subtle text-muted' };
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span className={cn('rounded-full px-[9px] py-[3px] text-[10px] font-semibold', meta.className)}>
      {meta.label}
    </span>
  );
}

function BookingsListContent() {
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

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">My bookings</h1>
            {data?.customer_name && (
              <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
                Reservations for {data.customer_name}. Select one to manage.
              </p>
            )}
          </div>
          <Link
            href={paths.manage}
            className="text-[12.5px] font-semibold text-primary hover:text-primary-hover"
          >
            New search
          </Link>
        </div>

        {ready && bookings.length === 0 && (
          <div className="mt-6 max-w-[480px] rounded-2xl border border-card-border bg-white p-6">
            <p className="text-[13.5px] text-muted">
              We couldn&apos;t find any bookings to show. Look up your reservation to get started.
            </p>
            <Link
              href={paths.manage}
              className="mt-4 inline-flex items-center gap-[6px] rounded-[10px] bg-primary px-[18px] py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Manage your booking <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {bookings.map((b) => {
              const isHighlighted = b.id === highlightId;
              return (
                <button
                  key={b.id}
                  onClick={() => openBooking(b)}
                  className={cn(
                    'flex flex-wrap items-center gap-5 rounded-2xl border bg-white p-5 text-left transition-colors hover:border-primary',
                    isHighlighted ? 'border-primary ring-2 ring-primary/15 bg-primary/[0.03]' : 'border-card-border',
                  )}
                >
                  <div
                    className="h-[68px] w-[96px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                    style={{ backgroundImage: `url('${b.vehicle.image || PLACEHOLDER_IMAGE}')` }}
                  />
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-faint">
                        Booking #{b.booking_reference.replace('BKG-', '')}
                      </span>
                      <StatusBadge status={b.status} />
                      <StatusBadge status={b.payment_status} />
                    </div>
                    <div className="my-[3px] text-[16px] font-semibold text-secondary">{b.vehicle.name}</div>
                    {b.vehicle.plate_number && (
                      <div className="text-[11px] text-faint">{b.vehicle.plate_number}</div>
                    )}
                    <div className="mt-[3px] text-[12.5px] text-muted">
                      {formatShortDate(b.pickup_datetime, b.timezone)} {formatTime(b.pickup_datetime, b.timezone)}
                      {' — '}
                      {formatShortDate(b.dropoff_datetime, b.timezone)} {formatTime(b.dropoff_datetime, b.timezone)}
                    </div>
                    {(b.pickup_location || b.dropoff_location) && (
                      <div className="text-[12px] text-faint">
                        {b.pickup_location}
                        {b.pickup_location && b.dropoff_location && b.pickup_location !== b.dropoff_location ? ` → ${b.dropoff_location}` : ''}
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-[6px] rounded-[9px] border border-line bg-white px-[16px] py-[9px] text-[12.5px] font-semibold text-ink">
                    View details <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function BookingsListPage() {
  return (
    <Suspense>
      <BookingsListContent />
    </Suspense>
  );
}
