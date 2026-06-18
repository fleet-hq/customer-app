import Link from 'next/link';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';

interface CarCardProps {
  vehicle: Vehicle;
  badge?: string;
  oldPrice?: number;
}

export function CarCard({ vehicle, badge, oldPrice }: CarCardProps) {
  const specs = [
    vehicle.seats ? `${vehicle.seats} Seats` : null,
    vehicle.transmission,
    vehicle.fuelType,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={paths.checkout(vehicle.id)}
      className="group flex flex-col overflow-hidden rounded-[16px] border border-card-border bg-white transition-shadow hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <div
          className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
          style={{ backgroundImage: `url('${vehicle.image}')` }}
        />
        {badge && (
          <span className="absolute top-3 left-3 rounded-full bg-primary px-[11px] py-[5px] text-[11px] font-semibold text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-[16px]">
        <div className="text-[15px] font-semibold text-secondary">{vehicle.name}</div>
        {vehicle.location && (
          <div className="mt-[5px] flex items-center gap-[5px] text-[11.5px] text-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-primary">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{vehicle.location}</span>
          </div>
        )}
        {specs && <div className="mt-[10px] text-[11.5px] text-faint">{specs}</div>}

        <div className="mt-auto flex items-baseline gap-[6px] pt-[14px]">
          <span className="text-[18px] font-bold text-secondary">{money(vehicle.pricePerDay)}</span>
          <span className="text-[11.5px] text-faint">/day</span>
          {oldPrice != null && (
            <span className="ml-auto text-[12px] text-faint line-through">{money(oldPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
