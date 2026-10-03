'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { formatShortDate, formatTime } from '@/utils/format-date';
import type { LookupBookingItem } from '@/services/bookingServices';
import { Dyn } from '@/components/i18n/Dyn';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { useBookingsList, statusMeta, STATUS_LABELS } from './use-bookings-list';
import BookingsListClientT2 from './bookings-client-t2';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

const TONE_CLASSNAME: Record<'success' | 'warning' | 'danger' | 'neutral' | 'info', string> = {
  success: 'bg-green-bg-2 text-success',
  warning: 'bg-amber-bg text-amber-text-2',
  danger: 'bg-danger-bg text-danger-text',
  neutral: 'bg-subtle text-muted',
  info: 'bg-info-bg text-info-text',
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  const { t } = useDynamicTranslation(STATUS_LABELS);
  return (
    <span className={cn('rounded-full px-[9px] py-[3px] text-[10px] font-semibold', TONE_CLASSNAME[meta.tone])}>
      {t(meta.label)}
    </span>
  );
}

function BookingsListContent() {
  const { tenant, highlightId, data, ready, bookings, openBooking } = useBookingsList();

  if (tenant.websiteTemplate === 'template_2') {
    return <BookingsListClientT2 />;
  }

  function handleOpen(booking: LookupBookingItem) {
    openBooking(booking);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink"><Dyn>My bookings</Dyn></h1>
            {data?.customer_name && (
              <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
                <Dyn>Reservations for</Dyn> {data.customer_name}. <Dyn>Select one to manage.</Dyn>
              </p>
            )}
          </div>
          <Link
            href={paths.manage}
            className="text-[12.5px] font-semibold text-primary hover:text-primary-hover"
          >
            <Dyn>New search</Dyn>
          </Link>
        </div>

        {ready && bookings.length === 0 && (
          <div className="mt-6 max-w-[480px] rounded-2xl border border-card-border bg-white p-6">
            <p className="text-[13.5px] text-muted">
              <Dyn>We couldn&apos;t find any bookings to show. Look up your reservation to get started.</Dyn>
            </p>
            <Link
              href={paths.manage}
              className="mt-4 inline-flex items-center gap-[6px] rounded-[10px] bg-primary px-[18px] py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <Dyn>Manage your booking</Dyn> <ArrowRight size={14} />
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
                  onClick={() => handleOpen(b)}
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
                        <Dyn>Booking</Dyn> #{b.booking_reference.replace('BKG-', '')}
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
                    <Dyn>View details</Dyn> <ArrowRight size={14} />
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
