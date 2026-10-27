import { Dyn } from '@/components/i18n/Dyn';
import type { BookingDetails } from '@/services/bookingServices';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.svg';

function rentalDays(booking: BookingDetails): number {
  const start = new Date(booking.pickUp.rawDatetime).getTime();
  const end = new Date(booking.dropOff.rawDatetime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  const hours = Math.max(1, Math.ceil((end - start) / 3600000));
  return Math.max(1, Math.ceil(hours / 24));
}

export function VehicleDriverCard({ booking }: { booking: BookingDetails }) {
  const image = booking.vehicle.image && booking.vehicle.image.trim() !== '' ? booking.vehicle.image : PLACEHOLDER_IMAGE;
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-[18px]">
        <div className="flex gap-4">
          <div
            className="h-[82px] w-[116px] flex-shrink-0 rounded-[11px] bg-cover bg-center"
            style={{ backgroundImage: `url('${image}')` }}
          />
          <div>
            <div className="text-[11px] text-faint"><Dyn>Booking</Dyn> #{booking.invoice.number}</div>
            <div className="my-[3px] text-[19px] font-semibold text-secondary">{booking.vehicle.name}</div>
            <div className="inline-flex items-center gap-[5px] text-xs font-semibold text-primary">
              <Dyn>Plate</Dyn> {booking.vehicle.licensePlate}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-faint"><Dyn>Booked on</Dyn></div>
          <div className="mt-[3px] text-sm font-semibold text-ink">{booking.bookedOn}</div>
        </div>
      </div>
      <div className="my-5 h-px bg-card-border" />
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 md:grid-cols-4">
        <Detail label="Driver name" value={booking.customer.name} />
        <Detail label="Email" value={booking.customer.email} breakAll />
        <Detail label="Phone" value={booking.customer.phone} />
        <Detail label="Vehicle VIN" value={booking.vehicle.vin} />
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  // ``min-w-0`` + ``break-all`` lets long emails wrap inside their
  // own column instead of pushing into the neighbouring field.
  return (
    <div className="min-w-0">
      <div className="mb-[5px] text-[11px] text-faint"><Dyn>{label}</Dyn></div>
      <div
        className={`text-[13.5px] font-semibold text-ink ${breakAll ? 'break-all' : 'break-words'}`}
      >
        {value}
      </div>
    </div>
  );
}

export function TripDetails({ booking }: { booking: BookingDetails }) {
  const ongoing = booking.rentalModel !== 'daily';
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 sm:p-6">
      <h3 className="mb-4 text-[15px] font-semibold text-ink sm:mb-4.5">Trip details</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
        <TripEnd
          kind="Pick-up"
          dotClass="bg-primary"
          labelClass="text-primary"
          location={booking.pickUp.address}
          when={`${booking.pickUp.date} · ${booking.pickUp.time}`}
        />
        <div className="flex flex-shrink-0 items-center justify-center sm:justify-start">
          <span className="rounded-full bg-chip px-[10px] py-[5px] text-[10px] font-semibold whitespace-nowrap text-muted">
            {ongoing ? <Dyn>WEEKLY</Dyn> : <>{rentalDays(booking)} <Dyn>DAYS</Dyn></>}
          </span>
        </div>
        <TripEnd
          kind="Drop-off"
          dotClass="bg-danger"
          labelClass="text-danger"
          location={booking.dropOff.address}
          when={ongoing ? <Dyn>Until returned</Dyn> : `${booking.dropOff.date} · ${booking.dropOff.time}`}
        />
      </div>
    </div>
  );
}

function TripEnd({
  kind,
  dotClass,
  labelClass,
  location,
  when,
}: {
  kind: string;
  dotClass: string;
  labelClass: string;
  location: string;
  when: React.ReactNode;
}) {
  return (
    <div className="flex-1 rounded-[11px] border border-hairline bg-subtle px-4 py-[14px]">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className={`text-[10px] font-semibold tracking-[0.05em] uppercase ${labelClass}`}><Dyn>{kind}</Dyn></span>
      </div>
      <div className="mt-[9px] mb-[3px] text-[14.5px] font-semibold text-secondary">{location}</div>
      <div className="text-[12.5px] text-muted">{when}</div>
    </div>
  );
}
