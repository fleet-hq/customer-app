'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CarCardT3 } from '@/components/fleet/car-card-t3';
import { Dyn } from '@/components/i18n/Dyn';
import { useFleets } from '@/hooks';
import { paths } from '@/lib/paths';

interface FleetGridT3Props {
  eyebrow?: string;
  title?: string;
  ctaLabel?: string;
}

const ALL = '__all__';

/** Real inventory via `useFleets`, the same hook templates 1 and 2
 *  use — never the raw template's demo cars.
 *
 *  The filter chips were a fixed list (SUV/Sedan/Van/Electric) in the
 *  raw markup. They are derived from the vehicle types actually in the
 *  fleet instead, so a tenant renting only sedans does not show three
 *  chips that match nothing. */
export function FleetGridT3({ eyebrow, title, ctaLabel }: FleetGridT3Props) {
  const { data } = useFleets(1, '', 8);
  const vehicles = useMemo(() => data?.results ?? [], [data]);
  const [filter, setFilter] = useState<string>(ALL);

  const types = useMemo(() => {
    const seen = new Set<string>();
    for (const v of vehicles) if (v.vehicleType) seen.add(v.vehicleType);
    return Array.from(seen);
  }, [vehicles]);

  const shown = filter === ALL ? vehicles : vehicles.filter((v) => v.vehicleType === filter);

  if (vehicles.length === 0) return null;

  return (
    <section id="fleet">
      <div className="wrap rule">
        <i className="x tl" />
        <i className="x tr" />
        <div className="sec-head">
          <div>
            {eyebrow ? (
              <div className="eyebrow">
                <Dyn>{eyebrow}</Dyn>
              </div>
            ) : null}
            {title ? (
              <h2>
                <Dyn>{title}</Dyn>
              </h2>
            ) : null}
          </div>
          {types.length > 1 ? (
            <div className="chips" role="group" aria-label="Filter fleet">
              <button
                type="button"
                className="chip"
                aria-pressed={filter === ALL}
                onClick={() => setFilter(ALL)}
              >
                <Dyn>All</Dyn>
              </button>
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="chip"
                  aria-pressed={filter === type}
                  onClick={() => setFilter(type)}
                >
                  <Dyn>{type}</Dyn>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="cars">
          {shown.map((vehicle) => (
            <CarCardT3 key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
        <div className="fleet-more">
          <Link className="btn ghost" href={paths.fleet}>
            <Dyn>{ctaLabel || 'See the full fleet'}</Dyn> <span className="chev">›</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
