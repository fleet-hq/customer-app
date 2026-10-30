'use client';

import Image from 'next/image';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';
import { Dyn } from '@/components/i18n/Dyn';
import { trackVehicleSelect } from '@/lib/tracking-events';
import styles from '@/styles/template-2.module.css';
import { useRateCard } from '@/hooks/useRentalSiteConfig';
import { cardPricing } from '@/lib/card-pricing';
import type { RateView } from '@/lib/rate-card';

interface CarCardT2Props {
  vehicle: Vehicle;
  bookingQuery?: string;
  /** Total selected duration in hours — see CarCard for the same contract. */
  hours?: number;
  discountPct?: number;
  unavailable?: boolean;
  view?: RateView;
}

export function CarCardT2({ vehicle, bookingQuery, hours, discountPct, unavailable, view }: CarCardT2Props) {
  const checkoutPath = paths.checkout(vehicle.slug || vehicle.id);
  const href = bookingQuery ? `${checkoutPath}?${bookingQuery}` : checkoutPath;

  const card = useRateCard(vehicle, view);
  const pricing = cardPricing(vehicle, card, hours, discountPct);

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
        ) : pricing.discounted ? (
          <span className={styles.carTag}>{Math.round(Number(discountPct))}% OFF</span>
        ) : card.weekly?.badge ? (
          <span className={styles.carTag}>
            <Dyn>{card.weekly.badge}</Dyn>
          </span>
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
        {card.extras ? (
          <p className={styles.carSpec}>
            {card.extras}
            {card.weekly ? <> · <Dyn>{card.weekly.label}</Dyn></> : null}
          </p>
        ) : null}
        <div className={styles.carFoot}>
          <span className={styles.carPrice}>
            {pricing.strikePrice != null ? <s>{money(pricing.strikePrice)}</s> : null}
            <b>{money(pricing.unitPrice)}</b>
            <span>{`/${pricing.unit}`}</span>
          </span>
          <span className={styles.carReserve}>
            <Dyn>{unavailable ? 'Unavailable' : 'Reserve'}</Dyn>
          </span>
        </div>
      </div>
    </Link>
  );
}
