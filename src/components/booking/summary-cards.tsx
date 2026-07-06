import { Download } from '@/components/ui/icons';
import { money } from '@/lib/utils';
import type { BookingDetails } from '@/services/bookingServices';
import type { BillingChargeRow } from '@/services/billingServices';

// Reason strings written by the admin extend/reduce/swap flows so we
// can label modification-related paid charges more helpfully than the
// raw "Additional charge" fallback.
const MODIFICATION_REASON_PATTERNS = [
  /trip\s*extend/i,
  /trip\s*reduce/i,
  /trip\s*modification/i,
  /extend.*modification/i,
  /reduce.*modification/i,
  /swap.*modification/i,
];

function looksLikeModification(reason?: string | null): boolean {
  if (!reason) return false;
  return MODIFICATION_REASON_PATTERNS.some((r) => r.test(reason));
}

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
    <div className="rounded-2xl border border-card-border bg-white p-4 sm:p-6">
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
  charges,
}: {
  booking: BookingDetails;
  total?: number;
  paid?: boolean;
  onPay?: () => void;
  payLoading?: boolean;
  /** Full billing charge list from `useBookingBalance`. Paid
   *  modification / manual charges are surfaced as an "Additional
   *  charges" section below the rental, so the customer can see
   *  what they were billed for after the admin ran an extension or
   *  added an ad-hoc charge. */
  charges?: BillingChargeRow[];
}) {
  const inv = booking.invoice;
  const extraLines = inv.extras.map((e) => ({ label: e.name, amount: e.price }));
  const grandTotal = total ?? inv.total;

  // Extension charges from the booking API's modification_requests —
  // guaranteed populated regardless of the billing.dual_write feature
  // flag. Each becomes its own sub-line under Rental at its actual
  // tax-inclusive charge amount, so the customer sees "3 days rental
  // + Trip extend $X" instead of the recomputed 4-day rental line.
  const extensionMods = booking.extensionMods ?? [];
  const modChargesTotalTaxInc = extensionMods.reduce(
    (s, m) => s + Number(m.priceDifference || 0),
    0,
  );

  // Non-modification paid ledger charges (damage fees, admin-added
  // manual items, etc.) still surface in their own "Additional
  // charges" section below Rental.
  const additionalCharges = (charges ?? []).filter((c) => {
    if (c.is_voided || c.status === 'voided') return false;
    if (c.status !== 'paid' && c.status !== 'partially_paid') return false;
    const type = c.type;
    if (type === 'booking_fee' || type === 'insurance_premium') return false;
    const isMod =
      type === 'modification_charge' ||
      (type === 'manual' && looksLikeModification(c.description));
    return !isMod;
  });

  // Derive the tax rate the backend applied to the recomputed booking,
  // so we can back out the tax baked into each mod's price_difference.
  // Match the backend's taxable base (rental + extras + insurance +
  // fees + location − discount) — the applicable_amount out of
  // PricingService.tax_details. Using only rental would break the rate
  // whenever fees/location are taxed too.
  const currentRentalPretax = inv.items.reduce(
    (s, i) => s + i.quantity * i.pricePerDay,
    0,
  );
  const extrasPretax = extraLines.reduce((s, e) => s + e.amount, 0);
  const taxableBase =
    currentRentalPretax +
    extrasPretax +
    inv.insurancePremium +
    inv.fees +
    inv.locationCharges -
    inv.discount;
  const taxRate = taxableBase > 0 ? inv.tax / taxableBase : 0;

  const modPretax =
    taxRate > 0 ? modChargesTotalTaxInc / (1 + taxRate) : modChargesTotalTaxInc;
  const modTaxOnly = Math.max(0, modChargesTotalTaxInc - modPretax);

  // Adjust rental item quantities down to reflect the ORIGINAL booking
  // (before mods). Distribute the pretax reduction proportionally
  // across items. Bookings typically have one rental item so this
  // collapses to a simple subtract.
  const rentalReduction = Math.min(currentRentalPretax, modPretax);
  const rentalLines =
    extensionMods.length > 0 && rentalReduction > 0 && inv.items.length > 0
      ? (() => {
          let remaining = rentalReduction;
          return inv.items.map((item, idx) => {
            const itemTotal = item.quantity * item.pricePerDay;
            const isLast = idx === inv.items.length - 1;
            const share = isLast
              ? remaining
              : (itemTotal / currentRentalPretax) * rentalReduction;
            remaining -= share;
            const newTotal = Math.max(0, itemTotal - share);
            const adjQty =
              item.pricePerDay > 0 ? newTotal / item.pricePerDay : item.quantity;
            const isWhole = Math.abs(adjQty - Math.round(adjQty)) < 0.05;
            const qtyLabel = isWhole
              ? Math.round(adjQty).toString()
              : adjQty.toFixed(2);
            return {
              label: item.name,
              sub: `${qtyLabel} × ${money(item.pricePerDay)} / ${item.unit ?? 'day'}`,
              amount: newTotal,
            };
          });
        })()
      : inv.items.map((item) => ({
          label: item.name,
          sub: `${item.quantity} × ${money(item.pricePerDay)} / ${item.unit ?? 'day'}`,
          amount: item.quantity * item.pricePerDay,
        }));

  // Subtract the tax portion baked into the mod charge lines so the
  // Tax row reflects only the base rental + extras/insurance tax.
  const displayTax = Math.max(0, inv.tax - modTaxOnly);
  const displayTaxAndFees = displayTax + inv.fees + inv.locationCharges;

  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 sm:p-6">
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
      {extensionMods.map((m) => {
        const label =
          m.type === 'extend'
            ? 'Trip extension'
            : m.type === 'reduce'
              ? 'Trip reduction'
              : m.type === 'swap'
                ? 'Vehicle swap'
                : m.type === 'date_change'
                  ? 'Date change'
                  : 'Trip modification';
        return (
          <div key={m.id} className="mt-2 flex items-start justify-between text-[13px]">
            <div className="min-w-0">
              <div className="font-medium text-ink">{label}</div>
              {m.createdAt && (
                <div className="mt-px text-[11.5px] text-faint">
                  {new Date(m.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>
            <span className="font-medium text-ink tabular-nums">
              {money(m.priceDifference)}
            </span>
          </div>
        );
      })}

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

      {additionalCharges.length > 0 && (
        <>
          {divider}
          <Group title="Additional charges" />
          {additionalCharges.map((c) => {
            const label = c.description || 'Trip modification';
            return (
              <div key={c.id} className="flex items-start justify-between text-[13px]">
                <div className="flex flex-wrap items-center gap-[7px]">
                  <span className="font-medium text-ink">{label}</span>
                  <span
                    className={
                      c.status === 'paid'
                        ? 'rounded-full bg-green-bg-2 px-[7px] py-[2px] text-[10px] font-semibold text-success'
                        : 'rounded-full bg-amber-bg px-[7px] py-[2px] text-[10px] font-semibold text-amber-text-2'
                    }
                  >
                    {c.status === 'paid' ? 'Paid' : 'Partial'}
                  </span>
                </div>
                <span className="font-semibold text-ink tabular-nums">
                  {money(Number(c.amount))}
                </span>
              </div>
            );
          })}
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
          {displayTaxAndFees > 0 ? money(displayTaxAndFees) : 'Included'}
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
        <button
          type="button"
          onClick={() => window.print()}
          title="Save or print this invoice as a PDF"
          aria-label="Download invoice as PDF"
          className="no-print flex h-[44px] w-[46px] flex-shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-ink hover:bg-subtle"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
