import { Download } from '@/components/ui/icons';
import { money } from '@/lib/utils';
import type { BookingDetails } from '@/services/bookingServices';

const PLACEHOLDER_IMAGE = '/images/car-cherokee.png';

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
    <div className="rounded-2xl border border-card-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-[18px]">
        <div className="flex gap-4">
          <div
            className="h-[82px] w-[116px] flex-shrink-0 rounded-[11px] bg-cover bg-center"
            style={{ backgroundImage: `url('${image}')` }}
          />
          <div>
            <div className="text-[11px] text-faint">Booking #{booking.invoice.number}</div>
            <div className="my-[3px] text-[19px] font-semibold text-secondary">{booking.vehicle.name}</div>
            <div className="inline-flex items-center gap-[5px] text-xs font-semibold text-primary">
              Plate {booking.vehicle.licensePlate}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-faint">Booked on</div>
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
      <div className="mb-[5px] text-[11px] text-faint">{label}</div>
      <div
        className={`text-[13.5px] font-semibold text-ink ${breakAll ? 'break-all' : 'break-words'}`}
      >
        {value}
      </div>
    </div>
  );
}

export function TripDetails({ booking }: { booking: BookingDetails }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white p-6">
      <h3 className="mb-[18px] text-[15px] font-semibold text-ink">Trip details</h3>
      <div className="flex items-stretch gap-4">
        <TripEnd
          kind="Pick-up"
          dotClass="bg-primary"
          labelClass="text-primary"
          location={booking.pickUp.address}
          when={`${booking.pickUp.date} · ${booking.pickUp.time}`}
        />
        <div className="flex flex-shrink-0 items-center">
          <span className="rounded-full bg-chip px-[10px] py-[5px] text-[10px] font-semibold whitespace-nowrap text-muted">
            {rentalDays(booking)} DAYS
          </span>
        </div>
        <TripEnd
          kind="Drop-off"
          dotClass="bg-danger"
          labelClass="text-danger"
          location={booking.dropOff.address}
          when={`${booking.dropOff.date} · ${booking.dropOff.time}`}
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
  when: string;
}) {
  return (
    <div className="flex-1 rounded-[11px] border border-hairline bg-subtle px-4 py-[14px]">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className={`text-[10px] font-semibold tracking-[0.05em] uppercase ${labelClass}`}>{kind}</span>
      </div>
      <div className="mt-[9px] mb-[3px] text-[14.5px] font-semibold text-secondary">{location}</div>
      <div className="text-[12.5px] text-muted">{when}</div>
    </div>
  );
}

function InvoiceRow({ label, sub, amount, accent }: { label: string; sub?: string; amount: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between text-[13px]">
      <div>
        <div className={accent ? 'font-medium text-success' : 'font-medium text-ink'}>{label}</div>
        {sub && <div className="mt-px text-[11.5px] text-faint">{sub}</div>}
      </div>
      <span className={accent ? 'font-semibold text-success' : 'font-medium text-ink'}>{amount}</span>
    </div>
  );
}

function Group({ title }: { title: string }) {
  return (
    <div className="mb-[11px] text-[11px] font-semibold tracking-[0.05em] text-faint uppercase">{title}</div>
  );
}

const divider = <div className="my-[14px] h-px bg-card-border" />;

export function Invoice({
  booking,
  total,
  paid = false,
  onPay,
  payLoading = false,
}: {
  booking: BookingDetails;
  total?: number;
  paid?: boolean;
  onPay?: () => void;
  payLoading?: boolean;
}) {
  const inv = booking.invoice;
  const rentalLines = inv.items.map((item) => ({
    label: item.name,
    sub: `${item.quantity} × ${money(item.pricePerDay)} / ${item.unit ?? 'day'}`,
    amount: item.quantity * item.pricePerDay,
  }));
  const extraLines = inv.extras.map((e) => ({ label: e.name, amount: e.price }));
  const grandTotal = total ?? inv.total;

  return (
    <div className="rounded-2xl border border-card-border bg-white p-6">
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-ink">Invoice</span>
          <span className="text-xs text-faint">#{inv.number}</span>
        </div>
        {paid ? (
          <span className="inline-flex items-center gap-[6px] rounded-full bg-green-bg-2 px-[11px] py-[5px] text-[11px] font-semibold text-success">
            <span className="h-[6px] w-[6px] rounded-full bg-success" />
            Paid
          </span>
        ) : (
          <span className="inline-flex items-center gap-[6px] rounded-full bg-amber-bg px-[11px] py-[5px] text-[11px] font-semibold text-amber-text-2">
            <span className="h-[6px] w-[6px] rounded-full bg-accent" />
            Payment pending
          </span>
        )}
      </div>

      <Group title="Rental" />
      {rentalLines.map((line, i) => (
        <InvoiceRow key={`r-${i}`} label={line.label} sub={line.sub} amount={money(line.amount)} />
      ))}

      {inv.insurancePremium > 0 && (
        <>
          {divider}
          <Group title="Insurance" />
          <InvoiceRow label="Protection plan" amount={money(inv.insurancePremium)} />
        </>
      )}

      {extraLines.length > 0 && (
        <>
          {divider}
          <Group title="Add-ons" />
          {extraLines.map((line, i) => (
            <InvoiceRow key={`e-${i}`} label={line.label} amount={money(line.amount)} />
          ))}
        </>
      )}

      {inv.discount > 0 && (
        <>
          {divider}
          <Group title="Discounts" />
          <div className="flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-[7px]">
              <span className="font-medium text-primary">Discount</span>
              {inv.discountCode && (
                <span className="rounded-[5px] bg-primary-soft px-[7px] py-[2px] text-[10px] font-semibold text-primary">
                  {inv.discountCode}
                </span>
              )}
            </div>
            <span className="font-semibold text-primary">−{money(inv.discount)}</span>
          </div>
        </>
      )}

      {divider}
      <Group title="Taxes & fees" />
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted">Sales tax &amp; surcharges</span>
        <span className="font-medium text-ink">
          {inv.tax + inv.fees + inv.locationCharges > 0 ? money(inv.tax + inv.fees + inv.locationCharges) : 'Included'}
        </span>
      </div>
      <div className="my-4 h-px bg-card-border" />
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-bold text-ink">Total</span>
        <span>
          <span className="mr-[3px] text-[11px] text-faint">USD</span>
          <span className="text-[22px] font-bold text-secondary">{money(grandTotal)}</span>
        </span>
      </div>
      <div className="mt-[18px] flex items-center gap-3">
        <button
          onClick={onPay}
          disabled={paid || payLoading || !onPay}
          className="flex-1 rounded-[9px] bg-primary py-3 text-center text-sm font-semibold text-white disabled:opacity-50"
        >
          {paid ? 'Paid' : payLoading ? 'Redirecting…' : 'Make Payment'}
        </button>
        <button className="flex h-[44px] w-[46px] flex-shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-ink">
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
