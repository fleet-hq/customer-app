'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { DEMO_USER } from '@/lib/mock-data';
import { formatShortDate, formatTime } from '@/utils/format-date';
import { setBookingToken } from '@/utils/booking-token';
import { lookupBooking, type BookingLookupResponse } from '@/services/bookingServices';

interface FormErrors {
  booking_id?: string;
  last_name?: string;
  email?: string;
  general?: string;
}

const PLACEHOLDER_IMAGE = '/images/car-cherokee.png';

const STATUS_META: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-green-bg-2 text-success' },
  pending: { label: 'Payment pending', className: 'bg-amber-bg text-amber-text-2' },
  cancelled: { label: 'Cancelled', className: 'bg-danger-bg text-danger-text' },
};

function statusMeta(status: string) {
  const key = status.toLowerCase();
  return STATUS_META[key] ?? { label: status, className: 'bg-subtle text-muted' };
}

export default function ManageBookingsPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BookingLookupResponse | null>(null);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!bookingId.trim()) {
      errs.booking_id = 'Booking ID is required.';
    }
    if (!lastName.trim() && !email.trim()) {
      errs.general = 'Please provide your last name or email address.';
    }
    if (lastName.trim() && !/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
      errs.last_name = 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setResult(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await lookupBooking({
        booking_id: `BKG-${bookingId.trim()}`,
        ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
      });

      setBookingToken(response.booking_token);

      if (response.bookings.length === 1) {
        router.push(`/booking/${response.bookings[0].id}?token=${response.booking_token}`);
        return;
      }

      setResult(response);
    } catch (err) {
      const data = (err as { response?: { data?: { non_field_errors?: string[]; booking_id?: string[] } } })?.response?.data;
      if (data?.non_field_errors) {
        setErrors({ general: data.non_field_errors[0] });
      } else if (data?.booking_id) {
        setErrors({ booking_id: data.booking_id[0] });
      } else {
        setErrors({ general: 'No booking found. Please check your details and try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  function openBooking(id: number) {
    if (!result) return;
    setBookingToken(result.booking_token);
    router.push(`/booking/${id}?token=${result.booking_token}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header active="" signedIn userName={DEMO_USER.name} userEmail={DEMO_USER.email} />
      <section className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">Manage your booking</h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          Look up your reservation with your booking ID and last name or email — then modify dates, swap vehicles, or view invoices.
        </p>

        {!result && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 max-w-[480px] rounded-2xl border border-card-border bg-white p-6"
          >
            {errors.general && (
              <div className="mb-5 rounded-[10px] bg-danger-bg px-4 py-3 text-[13px] text-danger-text">
                {errors.general}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-ink">Booking ID</label>
              <div className="mt-2 flex items-center rounded-[10px] border border-line bg-white px-3 focus-within:border-primary">
                <span className="select-none text-[13px] font-semibold text-faint">BKG -</span>
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.replace(/^BKG\s*-?\s*/i, ''))}
                  placeholder="Enter your booking number"
                  className="w-full bg-transparent px-2 py-[10px] text-[13px] text-ink placeholder:text-faint focus:outline-none"
                />
              </div>
              {errors.booking_id && <p className="mt-1 text-[11px] text-danger-text">{errors.booking_id}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-ink">Last name on driver&apos;s license</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                className={cn(
                  'mt-2 w-full rounded-[10px] border bg-white px-3 py-[10px] text-[13px] text-ink placeholder:text-faint focus:outline-none focus:border-primary',
                  errors.last_name ? 'border-danger-text' : 'border-line',
                )}
              />
              {errors.last_name && <p className="mt-1 text-[11px] text-danger-text">{errors.last_name}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-[13px] font-semibold text-ink">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={cn(
                  'mt-2 w-full rounded-[10px] border bg-white px-3 py-[10px] text-[13px] text-ink placeholder:text-faint focus:outline-none focus:border-primary',
                  errors.email ? 'border-danger-text' : 'border-line',
                )}
              />
              {errors.email && <p className="mt-1 text-[11px] text-danger-text">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[10px] bg-primary py-[12px] text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {isLoading ? 'Looking up…' : 'Continue'}
            </button>
          </form>
        )}

        {result && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] text-muted">
                We found multiple bookings for {result.customer_name}. Select one to manage.
              </p>
              <button
                onClick={() => setResult(null)}
                className="text-[12.5px] font-semibold text-primary hover:text-primary-hover"
              >
                New search
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {result.bookings.map((b) => {
                const meta = statusMeta(b.status);
                return (
                  <button
                    key={b.id}
                    onClick={() => openBooking(b.id)}
                    className="flex flex-wrap items-center gap-5 rounded-2xl border border-card-border bg-white p-5 text-left transition-colors hover:border-primary"
                  >
                    <div
                      className="h-[68px] w-[96px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                      style={{ backgroundImage: `url('${b.vehicle.image || PLACEHOLDER_IMAGE}')` }}
                    />
                    <div className="min-w-[200px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-faint">
                          Booking #{b.booking_reference.replace('BKG-', '')}
                        </span>
                        <span className={cn('rounded-full px-[9px] py-[3px] text-[10px] font-semibold', meta.className)}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="my-[3px] text-[16px] font-semibold text-secondary">{b.vehicle.name}</div>
                      <div className="text-[12.5px] text-muted">
                        {formatShortDate(b.pickup_datetime, b.timezone)} {formatTime(b.pickup_datetime, b.timezone)}
                        {' — '}
                        {formatShortDate(b.dropoff_datetime, b.timezone)} {formatTime(b.dropoff_datetime, b.timezone)}
                      </div>
                      {b.pickup_location && (
                        <div className="text-[12px] text-faint">{b.pickup_location}</div>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-[6px] rounded-[9px] border border-line bg-white px-[16px] py-[9px] text-[12.5px] font-semibold text-ink">
                      View details <ArrowRight size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
