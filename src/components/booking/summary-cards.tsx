import { Download } from '@/components/ui/icons';
import { money } from '@/lib/utils';
import { bookingQuoteInput, getVehicle, type Booking } from '@/lib/mock-data';
import { buildQuote, type QuoteGroup } from '@/lib/pricing';

export function VehicleDriverCard({ booking }: { booking: Booking }) {
  const image = getVehicle(booking.vehicleId)?.image ?? '/images/car-cherokee.png';
  return (
    <div className="rounded-2xl border border-card-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-[18px]">
        <div className="flex gap-4">
          <div
            className="h-[82px] w-[116px] flex-shrink-0 rounded-[11px] bg-cover bg-center"
            style={{ backgroundImage: `url('${image}')` }}
          />
          <div>
            <div className="text-[11px] text-faint">Booking #{booking.id}</div>
            <div className="my-[3px] text-[19px] font-semibold text-secondary">{booking.vehicleName}</div>
            <div className="inline-flex items-center gap-[5px] text-xs font-semibold text-primary">
              Plate {booking.plate}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-faint">Booked on</div>
          <div className="mt-[3px] text-sm font-semibold text-ink">{booking.bookedOn}</div>
        </div>
      </div>
      <div className="my-5 h-px bg-card-border" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[18px]">
        <Detail label="Driver name" value={booking.driver.name} />
        <Detail label="Email" value={booking.driver.email} />
        <Detail label="Phone" value={booking.driver.phone} />
        <Detail label="Vehicle VIN" value={booking.vin} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-[5px] text-[11px] text-faint">{label}</div>
      <div className="text-[13.5px] font-semibold text-ink">{value}</div>
    </div>
  );
}

export function TripDetails({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white p-6">
      <h3 className="mb-[18px] text-[15px] font-semibold text-ink">Trip details</h3>
      <div className="flex items-stretch gap-4">
        <TripEnd
          kind="Pick-up"
          dotClass="bg-primary"
          labelClass="text-primary"
          location={booking.pickup.location}
          when={`${booking.pickup.date} · ${booking.pickup.time}`}
        />
        <div className="flex flex-shrink-0 items-center">
          <span className="rounded-full bg-chip px-[10px] py-[5px] text-[10px] font-semibold whitespace-nowrap text-muted">
            {booking.days} DAYS
          </span>
        </div>
        <TripEnd
          kind="Drop-off"
          dotClass="bg-danger"
          labelClass="text-danger"
          location={booking.dropoff.location}
          when={`${booking.dropoff.date} · ${booking.dropoff.time}`}
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

const INVOICE_SECTIONS: { group: QuoteGroup; title: string }[] = [
  { group: 'rental', title: 'Rental' },
  { group: 'insurance', title: 'Insurance' },
  { group: 'addons', title: 'Add-ons' },
  { group: 'discount', title: 'Discounts' },
];

export function Invoice({ booking }: { booking: Booking }) {
  const quote = buildQuote(bookingQuoteInput(booking));
  const sections = INVOICE_SECTIONS.map((s) => ({
    ...s,
    lines: quote.lines.filter((l) => l.group === s.group),
  })).filter((s) => s.lines.length > 0);

  return (
    <div className="rounded-2xl border border-card-border bg-white p-6">
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-ink">Invoice</span>
          <span className="text-xs text-faint">#{booking.invoiceNo}</span>
        </div>
        <span className="inline-flex items-center gap-[6px] rounded-full bg-amber-bg px-[11px] py-[5px] text-[11px] font-semibold text-amber-text-2">
          <span className="h-[6px] w-[6px] rounded-full bg-accent" />
          Payment pending
        </span>
      </div>

      {sections.map((section, si) => (
        <div key={section.group}>
          <Group title={section.title} />
          {section.lines.map((line, i) =>
            line.group === 'discount' ? (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-[7px]">
                  <span className="font-medium text-primary">{line.label}</span>
                  {line.code && (
                    <span className="rounded-[5px] bg-primary-soft px-[7px] py-[2px] text-[10px] font-semibold text-primary">
                      {line.code}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-primary">−{money(Math.abs(line.amount))}</span>
              </div>
            ) : (
              <InvoiceRow key={i} label={line.label} sub={line.sub} amount={money(line.amount)} />
            ),
          )}
          {si < sections.length - 1 && divider}
        </div>
      ))}
      {divider}
      <Group title="Taxes & fees" />
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted">Sales tax &amp; surcharges</span>
        <span className="font-medium text-ink">Included</span>
      </div>
      <div className="my-4 h-px bg-card-border" />
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-bold text-ink">Total</span>
        <span>
          <span className="mr-[3px] text-[11px] text-faint">USD</span>
          <span className="text-[22px] font-bold text-secondary">{money(quote.total)}</span>
        </span>
      </div>
      <div className="mt-[18px] flex items-center gap-3">
        <button className="flex-1 rounded-[9px] bg-primary py-3 text-center text-sm font-semibold text-white">
          Make Payment
        </button>
        <button className="flex h-[44px] w-[46px] flex-shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-ink">
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
