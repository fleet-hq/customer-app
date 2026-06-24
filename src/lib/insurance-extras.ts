import type { BookingDetails } from '@/services/bookingServices';

export function isInsuranceExtra(name?: string | null): boolean {
  return !!name && name.toLowerCase().includes('insurance');
}

export function bookingHasInsuranceExtra(booking: BookingDetails): boolean {
  return (booking.invoice?.extras ?? []).some((e) => isInsuranceExtra(e.name));
}
