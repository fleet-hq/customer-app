import Link from 'next/link';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';
import { Dyn } from '@/components/i18n/Dyn';

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const href = paths.checkout(vehicle.slug);
  const specs = [
    vehicle.seats ? (
      <>
        {vehicle.seats} <Dyn>seats</Dyn>
      </>
    ) : null,
    vehicle.transmission ? <Dyn>{vehicle.transmission}</Dyn> : null,
    vehicle.fuelType ? <Dyn>{vehicle.fuelType}</Dyn> : null,
  ].filter(Boolean);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-card-border bg-white transition-shadow hover:shadow-[var(--shadow-card)]">
      <Link href={href} className="relative block aspect-[16/11] overflow-hidden rounded-[14px]">
        <div
          className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
          style={{ backgroundImage: `url('${vehicle.image}')` }}
        />
        {vehicle.vehicleType && (
          <span className="absolute top-3 left-3 rounded-full bg-secondary/90 px-[11px] py-[5px] text-[11px] font-semibold text-white">
            {vehicle.vehicleType}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-[18px]">
        <Link href={href} className="text-[16px] font-semibold text-ink">
          {vehicle.name}
        </Link>

        {specs.length > 0 && (
          <div className="mt-[7px] text-xs text-faint">
            {specs.map((part, i) => (
              <span key={i}>
                {i > 0 ? ' · ' : ''}
                {part}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-[18px]">
          <div className="flex items-baseline gap-[3px]">
            <span className="text-[19px] font-bold text-secondary">{money(vehicle.pricePerDay)}</span>
            <span className="text-xs text-faint"><Dyn>/day</Dyn></span>
          </div>
          <Link
            href={href}
            className="rounded-[9px] bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Dyn>Book now</Dyn>
          </Link>
        </div>
      </div>
    </div>
  );
}
