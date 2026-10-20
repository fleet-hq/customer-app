'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';
import { trackVehicleSelect } from '@/lib/tracking-events';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';
import { useRateCard } from '@/hooks/useRentalSiteConfig';

interface CarCardT3Props {
  vehicle: Vehicle;
  bookingQuery?: string;
  unavailable?: boolean;
  /** The raw template gives the two surfaces different footers: the
   *  home grid sells with a filled "Reserve" button, the fleet listing
   *  browses with a plain "View" link beside the trip total. */
  variant?: 'reserve' | 'view';
  /** Trip total, shown by the listing in place of the per-day rate. */
  totalPrice?: number;
  days?: number;
}

/** The raw template's card: photo panel with an availability tag, then
 *  class, name, specs and a price footer.
 *
 *  Its price was the hardcoded "$400 / week" Zenith charges. This
 *  reads the vehicle's own daily rate, because a template that
 *  advertises one company's pricing to every tenant is not a template. */
export function CarCardT3({
  vehicle,
  bookingQuery,
  unavailable,
  variant = 'reserve',
  totalPrice,
  days,
}: CarCardT3Props) {
  const checkoutPath = paths.checkout(vehicle.slug || vehicle.id);
  const href = bookingQuery ? `${checkoutPath}?${bookingQuery}` : checkoutPath;
  const perDay = Number(vehicle.pricePerDay) || 0;
  const card = useRateCard(vehicle);

  const specs = [
    vehicle.seats ? `${vehicle.seats} seats` : '',
    vehicle.transmission,
    vehicle.fuelType,
  ].filter(Boolean);

  return (
    <article className="car">
      <div className="ph">
        <span className="avail">
          <Dyn>{unavailable ? 'Unavailable' : card.weekly?.badge ?? 'Available'}</Dyn>
        </span>
        {vehicle.image ? (
          <Image className="img" src={vehicle.image} alt={vehicle.name} width={520} height={340} loading="lazy" unoptimized />
        ) : null}
      </div>
      <div className="bd">
        <div>
          {vehicle.vehicleType ? <div className="cls">{vehicle.vehicleType}</div> : null}
          <h3>{vehicle.name}</h3>
        </div>
        {specs.length > 0 ? (
          <div className="specs">
            {specs.map((spec) => (
              <span key={spec}>
                <Dyn>{spec}</Dyn>
              </span>
            ))}
          </div>
        ) : null}
        {card.extras ? (
          <div className="specs">
            <span>{card.extras}</span>
            {card.weekly ? (
              <span>
                <Dyn>{card.weekly.label}</Dyn>
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="ft">
          {variant === 'view' && totalPrice != null && totalPrice > 0 ? (
            <div className="tot">
              <b>{money(totalPrice)}</b>
              <small>
                <Dyn>total</Dyn>
                {days ? ` · ${days} ` : ''}
                {days ? <Dyn>{days === 1 ? 'day' : 'days'}</Dyn> : null}
                {perDay > 0 ? ` · ${money(perDay)} / ` : ''}
                {perDay > 0 ? <Dyn>day</Dyn> : null}
              </small>
            </div>
          ) : perDay > 0 ? (
            <div className="price">
              {money(perDay)}
              <small>
                <Dyn>/ day</Dyn>
              </small>
            </div>
          ) : (
            <div className="price" />
          )}
          {variant === 'view' ? (
            <Link className="view" href={href} onClick={() => trackVehicleSelect(vehicle)}>
              <Dyn>View</Dyn> <span className="chev">›</span>
            </Link>
          ) : (
            <Link className="btn" href={href} onClick={() => trackVehicleSelect(vehicle)}>
              <Dyn>Reserve</Dyn> <span className="chev">›</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
