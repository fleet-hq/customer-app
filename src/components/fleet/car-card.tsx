'use client';

import Link from 'next/link';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';
import { Dyn } from '@/components/i18n/Dyn';
import { trackVehicleSelect } from '@/lib/tracking-events';
import { useRateCard } from '@/hooks/useRentalSiteConfig';
import { cardPricing } from '@/lib/card-pricing';
import type { RateView } from '@/lib/rate-card';

interface CarCardProps {
  vehicle: Vehicle;
  badge?: string;
  oldPrice?: number;
  bookingQuery?: string;
  /** Total selected duration in hours. When ≤23 the card leads with
   *  hourly pricing (matches backend HOURLY_RATE_MAX_HOURS=23); when
   *  ≥24 it rolls up to days at the daily rate. Undefined = no date
   *  range selected, single `/day` line only. */
  hours?: number;
  /** Discount tier %, 0–100. When > 0 and `hours` is set, the card
   *  strikes through the base unit rate and shows the discounted rate
   *  as the headline. Parent is responsible for picking the applicable
   *  tier — this matches the backend's per-booking logic. */
  discountPct?: number;
  view?: RateView;
}

export function CarCard({ vehicle, badge, oldPrice, bookingQuery, hours, discountPct, view }: CarCardProps) {
  const checkoutPath = paths.checkout(vehicle.slug);
  const href = bookingQuery ? `${checkoutPath}?${bookingQuery}` : checkoutPath;

  const card = useRateCard(vehicle, view);
  const tag = badge ?? card.weekly?.badge ?? null;
  const pricing = cardPricing(vehicle, card, hours, discountPct);
  const ranged = pricing.mode === 'hourly' || pricing.mode === 'daily';
  const strikeUnitPrice = pricing.strikePrice ?? oldPrice ?? null;
  const unitNoun = `${pricing.unit}${pricing.units === 1 ? '' : 's'}`;

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
      className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-card-border bg-white transition-shadow hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <div
          className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
          style={{ backgroundImage: `url('${vehicle.image}')` }}
        />
        {tag && (
          <span className="absolute top-[10px] left-[10px] rounded-full bg-primary px-[8px] py-[3px] text-[9px] font-semibold tracking-[0.02em] text-white">
            <Dyn>{tag}</Dyn>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-[16px]">
        {vehicle.vehicleType && (
          <div className="mb-[5px] truncate text-[10.5px] font-semibold tracking-[0.05em] uppercase text-primary">
            <Dyn>{vehicle.vehicleType}</Dyn>
          </div>
        )}
        <div className="truncate text-[15px] leading-none font-semibold text-ink">{vehicle.name}</div>
        {vehicle.location && (
          <div className="mt-[5px] truncate text-[11.5px] text-muted">
            {vehicle.location}
          </div>
        )}

        <div className="mt-[10px] flex flex-nowrap items-center gap-x-[10px] text-[11.5px] text-faint overflow-hidden">
          {vehicle.seats ? (
            <span className="inline-flex shrink-0 items-center gap-[4px]">
              <SeatIcon />
              {vehicle.seats} <Dyn>Seats</Dyn>
            </span>
          ) : null}
          {vehicle.transmission ? (
            <span className="inline-flex min-w-0 items-center gap-[4px]">
              <TransmissionIcon />
              <span className="truncate capitalize"><Dyn>{vehicle.transmission.toLowerCase()}</Dyn></span>
            </span>
          ) : null}
          {vehicle.fuelType ? (
            <span className="inline-flex shrink-0 items-center gap-[4px] capitalize">
              <FuelIcon />
              <Dyn>{vehicle.fuelType.toLowerCase()}</Dyn>
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-[12px]">
          <div className="h-px w-full bg-card-border" />

          {ranged ? (
            <div className="pt-[12px]">
              <div className="text-[12px] text-muted">
                <span className="text-[16px] font-bold text-secondary">{money(pricing.total)}</span>{' '}
                <Dyn>total</Dyn> · {pricing.units} {unitNoun}
              </div>
              <div className="mt-[6px] flex items-baseline justify-between gap-[6px]">
                <div className="flex items-baseline gap-[6px]">
                  <span className="text-[15px] font-semibold text-secondary">{money(pricing.unitPrice)}</span>
                  <span className="text-[11.5px] text-faint"><Dyn>{`/${pricing.unit}`}</Dyn></span>
                  {strikeUnitPrice != null && (
                    <span className="text-[12px] text-faint line-through">{money(strikeUnitPrice)}</span>
                  )}
                </div>
                <ViewCta label={card.ongoing ? 'Select' : 'View'} />
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between gap-[6px] pt-[12px]">
              <div className="flex items-baseline gap-[6px]">
                {card.ongoing && <span className="text-[12px] text-faint"><Dyn>from</Dyn></span>}
                <span className="text-[18px] font-bold text-secondary">{money(pricing.unitPrice)}</span>
                <span className="text-[11.5px] text-faint"><Dyn>{`/${pricing.unit}`}</Dyn></span>
                {strikeUnitPrice != null && (
                  <span className="text-[12px] text-faint line-through">{money(strikeUnitPrice)}</span>
                )}
              </div>
              <ViewCta label={card.ongoing ? 'Select' : 'View'} />
            </div>
          )}
          {card.ongoing && (
            <div className="pt-[6px] text-[11.5px] leading-[1.45] text-faint">
              <Dyn>Ongoing</Dyn>
              {card.altRate ? (
                <>
                  {' · '}
                  <Dyn>{`from ${money(card.altRate.perWeek)}/wk ${card.altRate.cycleLabel}`}</Dyn>
                </>
              ) : null}
              {card.minTerm ? (
                <>
                  {' · '}
                  <Dyn>{card.minTerm}</Dyn>
                </>
              ) : null}
            </div>
          )}
          {card.extras && (
            <div className="mt-[6px] text-[11.5px] text-faint">
              {card.extras}
              {card.weekly && (
                <span className="font-semibold text-primary"> · <Dyn>{card.weekly.label}</Dyn></span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function ViewCta({ label = 'View' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-[4px] text-[12px] font-semibold text-primary">
      <Dyn>{label}</Dyn>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}

function SeatIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 21c.6-3.6 3.4-6 6.5-6s5.9 2.4 6.5 6" />
    </svg>
  );
}

function TransmissionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function FuelIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
      <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M4 21h10" />
      <path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-2-2" />
    </svg>
  );
}
