import type { BillingChargeRow } from '@/services/billingServices';
import type { BookingDetails } from '@/services/bookingServices';

export interface ChargeBreakdown {
  title: string;
  sub: string | null;
  lines: [string, number][];
}

export function chargeBreakdown(charge: BillingChargeRow, booking: BookingDetails): ChargeBreakdown {
  if (charge.type !== 'booking_fee') {
    return { title: charge.description || charge.type_label || charge.type, sub: null, lines: [] };
  }
  const inv = booking.invoice;
  const lines: [string, number][] = [];
  if (inv.rentalTotal > 0) lines.push(['Rental', inv.rentalTotal]);
  if (inv.fees > 0) lines.push(['Fees', inv.fees]);
  if (inv.discount > 0) lines.push(['Discount', -inv.discount]);
  if (inv.tax > 0) lines.push(['Tax', inv.tax]);
  if (inv.deposit > 0) lines.push(['Security deposit', inv.deposit]);
  return { title: booking.vehicle.name, sub: `${booking.pickUp.date} – ${booking.dropOff.date}`, lines };
}
