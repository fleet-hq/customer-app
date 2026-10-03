'use client';

import Image from 'next/image';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';
import { Dyn } from '@/components/i18n/Dyn';
import { trackVehicleSelect } from '@/lib/tracking-events';
import styles from '@/styles/template-2.module.css';

interface CarCardT2Props {
  vehicle: Vehicle;
  bookingQuery?: string;
  /** Total selected duration in hours — see CarCard for the same contract. */
  hours?: number;
  discountPct?: number;
  unavailable?: boolean;
}

const HOURLY_MAX_HOURS = 23;

export function CarCardT2({ vehicle, bookingQuery, hours, discountPct, unavailable }: CarCardT2Props) {
  const checkoutPath = paths.checkout(vehicle.slug || vehicle.id);
  const href = bookingQuery ? `${checkoutPath}?${bookingQuery}` : checkoutPath;

  const perDay = Number(vehicle.pricePerDay) || 0;
  const perHour = Number(vehicle.pricePerHour) || 0;

  let mode: 'idle' | 'hourly' | 'daily' = 'idle';
  let unitLabel = '/day';
  let baseUnitPrice = perDay;

  if (hours && hours > 0) {
    if (hours <= HOURLY_MAX_HOURS && perHour > 0) {
      mode = 'hourly';
      unitLabel = '/hr';
      baseUnitPrice = perHour;
    } else {
      mode = 'daily';
      unitLabel = '/day';
      baseUnitPrice = perDay;
    }
  }

  const pct = Number(discountPct) || 0;
  const hasDiscount = pct > 0 && pct < 100;
  const unitPrice = hasDiscount ? baseUnitPrice * (1 - pct / 100) : baseUnitPrice;
  const displayLabel = mode === 'idle' ? '/day' : unitLabel;

  return (
    <Link
      href={href}
      onClick={() =>
        trackVehicleSelect({
          id: vehicle.id,
          name: vehicle.name,
          pricePerDay: vehicle.pricePerDay,
          vehicleType: vehicle.vehicleType,
        })
      }
      className={styles.carCard}
      style={unavailable ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
    >
      <div className={styles.carMedia}>
        {unavailable ? (
          <span className={styles.carTag}>
            <Dyn>Unavailable</Dyn>
          </span>
        ) : hasDiscount ? (
          <span className={styles.carTag}>{Math.round(pct)}% OFF</span>
        ) : null}
        {vehicle.image ? (
          <Image src={vehicle.image} alt={vehicle.name} width={780} height={523} unoptimized />
        ) : (
          <div style={{ aspectRatio: '3 / 2', background: 'var(--line)' }} />
        )}
      </div>
      <div className={styles.carBody}>
        <h3>{vehicle.name}</h3>
        <p className={styles.carSpec}>
          {[vehicle.vehicleType, vehicle.seats ? `${vehicle.seats} seats` : '', vehicle.transmission]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className={styles.carFoot}>
          <span className={styles.carPrice}>
            {hasDiscount ? <s>{money(baseUnitPrice)}</s> : null}
            <b>{money(unitPrice)}</b>
            <span>{displayLabel}</span>
          </span>
          <span className={styles.carReserve}>
            <Dyn>{unavailable ? 'Unavailable' : 'Reserve'}</Dyn>
          </span>
        </div>
      </div>
    </Link>
  );
}
