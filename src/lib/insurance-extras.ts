import type { BookingDetails } from '@/services/bookingServices';

export function isInsuranceExtra(name?: string | null): boolean {
  return !!name && name.toLowerCase().includes('insurance');
}

export function bookingHasInsuranceExtra(booking: BookingDetails): boolean {
  return (booking.invoice?.extras ?? []).some((e) => isInsuranceExtra(e.name));
}

/**
 * Whether this booking is covered at all, by any route.
 *
 * Insurance bought through the platform counts. Only the extras list
 * was being checked, so a renter who had paid for Bonzah at checkout
 * was still shown "verify your insurance" and blocked behind it — the
 * one person who demonstrably does not need to prove cover.
 *
 * A policy still being issued counts too: the renter has paid for it
 * and whether it has reached the insurer yet is not their problem.
 */
export function bookingHasInsuranceCover(booking: BookingDetails): boolean {
  return bookingHasInsuranceExtra(booking) || !!booking.hasPlatformInsurance;
}
