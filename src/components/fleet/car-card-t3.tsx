'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';
import { trackVehicleSelect } from '@/lib/tracking-events';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';

interface CarCardT3Props {
  vehicle: Vehicle;
  bookingQuery?: string;
  unavailable?: boolean;
}

/** The raw template's card: photo panel with an availability tag, then
 *  class, name, specs and a price footer.
 *
 *  Its price was the hardcoded "$400 / week" Zenith charges. This
 *  reads the vehicle's own daily rate, because a template that
 *  advertises one company's pricing to every tenant is not a template. */
export function CarCardT3({ vehicle, bookingQuery, unavailable }: CarCardT3Props) {
  const checkoutPath = paths.checkout(vehicle.slug || vehicle.id);
  const href = bookingQuery ? `${checkoutPath}?${bookingQuery}` : checkoutPath;
  const perDay = Number(vehicle.pricePerDay) || 0;

  const specs = [
    vehicle.seats ? `${vehicle.seats} seats` : '',
    vehicle.transmission,
    vehicle.fuelType,
  ].filter(Boolean);

  return (
    <article className="car">
      <div className="ph">
        <span className="avail">
          <Dyn>{unavailable ? 'Unavailable' : 'Available'}</Dyn>
        </span>
        {vehicle.image ? (
          <Image src={vehicle.image} alt={vehicle.name} width={520} height={340} loading="lazy" unoptimized />
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
        <div className="ft">
          {perDay > 0 ? (
            <div className="price">
              {money(perDay)}
              <small>
                <Dyn>/ day</Dyn>
              </small>
            </div>
          ) : (
            <div className="price" />
          )}
          <Link className="btn" href={href} onClick={() => trackVehicleSelect(vehicle)}>
            <Dyn>Reserve</Dyn> <span className="chev">›</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
