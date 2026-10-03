'use client';

import { formatShortDate, formatTime } from '@/utils/format-date';
import { paths } from '@/lib/paths';
import type { LookupBookingItem } from '@/services/bookingServices';
import { Dyn } from '@/components/i18n/Dyn';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { useBookingsList, statusMeta, STATUS_LABELS } from './use-bookings-list';
import styles from '@/styles/template-2.module.css';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

const TONE_CLASSNAME: Record<'success' | 'warning' | 'danger' | 'neutral' | 'info', string> = {
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  danger: styles.statusDanger,
  neutral: styles.statusNeutral,
  info: styles.statusInfo,
};

function StatusBadgeT2({ status }: { status: string }) {
  const meta = statusMeta(status);
  const { t } = useDynamicTranslation(STATUS_LABELS);
  return <span className={`${styles.statusBadge} ${TONE_CLASSNAME[meta.tone]}`}>{t(meta.label)}</span>;
}

export default function BookingsListClientT2() {
  const { highlightId, data, ready, bookings, openBooking } = useBookingsList();

  function handleOpen(booking: LookupBookingItem) {
    openBooking(booking);
  }

  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <div>
            <h1 className={styles.toolbarHeading}><Dyn>My bookings</Dyn></h1>
            {data?.customer_name ? (
              <p className={styles.bookingsSub}>
                <Dyn>Reservations for</Dyn> {data.customer_name}. <Dyn>Select one to manage.</Dyn>
              </p>
            ) : null}
          </div>
          <a href={paths.manage} className={styles.clearFilter}>
            <Dyn>New search</Dyn>
          </a>
        </div>

        {ready && bookings.length === 0 ? (
          <div className={styles.emptyState}>
            <p><Dyn>We couldn&apos;t find any bookings to show. Look up your reservation to get started.</Dyn></p>
            <a href={paths.manage} className={`${styles.btn} ${styles.btnBrass}`} style={{ marginTop: '1.2rem' }}>
              <Dyn>Manage your booking</Dyn>
            </a>
          </div>
        ) : null}

        {bookings.length > 0 ? (
          <div className={styles.bookingsList}>
            {bookings.map((b) => {
              const isHighlighted = b.id === highlightId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleOpen(b)}
                  className={`${styles.bookingRow} ${isHighlighted ? styles.bookingRowActive : ''}`}
                >
                  <div
                    className={styles.bookingImage}
                    style={{ backgroundImage: `url('${b.vehicle.image || PLACEHOLDER_IMAGE}')` }}
                  />
                  <div className={styles.bookingInfo}>
                    <div className={styles.bookingMeta}>
                      <span className={styles.bookingRef}>
                        <Dyn>Booking</Dyn> #{b.booking_reference.replace('BKG-', '')}
                      </span>
                      <StatusBadgeT2 status={b.status} />
                      <StatusBadgeT2 status={b.payment_status} />
                    </div>
                    <div className={styles.bookingVehicle}>{b.vehicle.name}</div>
                    {b.vehicle.plate_number ? <div className={styles.bookingPlate}>{b.vehicle.plate_number}</div> : null}
                    <div className={styles.bookingDates}>
                      {formatShortDate(b.pickup_datetime, b.timezone)} {formatTime(b.pickup_datetime, b.timezone)}
                      {' — '}
                      {formatShortDate(b.dropoff_datetime, b.timezone)} {formatTime(b.dropoff_datetime, b.timezone)}
                    </div>
                    {b.pickup_location || b.dropoff_location ? (
                      <div className={styles.bookingLocation}>
                        {b.pickup_location}
                        {b.pickup_location && b.dropoff_location && b.pickup_location !== b.dropoff_location ? ` → ${b.dropoff_location}` : ''}
                      </div>
                    ) : null}
                  </div>
                  <span className={styles.bookingView}>
                    <Dyn>View details</Dyn>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
