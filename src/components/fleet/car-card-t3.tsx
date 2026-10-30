'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';
import { trackVehicleSelect } from '@/lib/tracking-events';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';
import { useRateCard } from '@/hooks/useRentalSiteConfig';
import { cardPricing } from '@/lib/card-pricing';
import type { RateView } from '@/lib/rate-card';

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
  view?: RateView;
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
  view,
}: CarCardT3Props) {
  const checkoutPath = paths.checkout(vehicle.slug || vehicle.id);
  const href = bookingQuery ? `${checkoutPath}?${bookingQuery}` : checkoutPath;
  const card = useRateCard(vehicle, view);
  const pricing = cardPricing(vehicle, card);

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
        <div className="spx">
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
        </div>
        <div className="ft">
          {variant === 'view' && pricing.mode !== 'weekly' && totalPrice != null && totalPrice > 0 ? (
            <div className="tot">
              <b>{money(totalPrice)}</b>
              <small>
                <Dyn>total</Dyn>
                {days ? ` · ${days} ` : ''}
                {days ? <Dyn>{days === 1 ? 'day' : 'days'}</Dyn> : null}
                {pricing.unitPrice > 0 ? ` · ${money(pricing.unitPrice)} / ` : ''}
                {pricing.unitPrice > 0 ? <Dyn>{pricing.unit}</Dyn> : null}
              </small>
            </div>
          ) : pricing.unitPrice > 0 && card.ongoing ? (
            <div className="tot">
              <b>
                {money(pricing.unitPrice)}
                <small>
                  <Dyn>{`/ ${pricing.unit}`}</Dyn>
                </small>
              </b>
              <small>
                <Dyn>Ongoing</Dyn>
                {card.altRate ? (
                  <>{' · '}<Dyn>{`from ${money(card.altRate.perWeek)}/wk ${card.altRate.cycleLabel}`}</Dyn></>
                ) : null}
                {card.minTerm ? (<>{' · '}<Dyn>{card.minTerm}</Dyn></>) : null}
              </small>
            </div>
          ) : pricing.unitPrice > 0 ? (
            <div className="price">
              {money(pricing.unitPrice)}
              {pricing.strikePrice != null ? <s>{money(pricing.strikePrice)}</s> : null}
              <small>
                <Dyn>{`/ ${pricing.unit}`}</Dyn>
              </small>
            </div>
          ) : (
            <div className="price" />
          )}
          {variant === 'view' ? (
            <Link className="view" href={href} onClick={() => trackVehicleSelect(vehicle)}>
              <Dyn>{card.ongoing ? 'Select' : 'View'}</Dyn> <span className="chev">›</span>
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
