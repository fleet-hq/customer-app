'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { setBookingToken } from '@/utils/booking-token';
import { lookupBooking, type BookingLookupResponse } from '@/services/bookingServices';

interface FormErrors {
  booking_id?: string;
  last_name?: string;
  email?: string;
  general?: string;
}

const LOOKUP_STORAGE_KEY = 'cc_lookup';

function redirectForResult(router: ReturnType<typeof useRouter>, data: BookingLookupResponse, replace = false) {
  const go = replace ? router.replace : router.push;
  if (data.bookings.length === 1) {
    go(`${paths.booking(String(data.bookings[0].id))}?token=${data.booking_token}`);
  } else if (data.bookings.length > 1) {
    go(`${paths.bookings}?highlight=${data.searched_booking_id}`);
  }
}

export default function ManageBookingsPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(LOOKUP_STORAGE_KEY);
    if (!stored) return;
    try {
      const data = JSON.parse(stored) as BookingLookupResponse;
      if (data?.bookings?.length) {
        redirectForResult(router, data, true);
      }
    } catch {
      sessionStorage.removeItem(LOOKUP_STORAGE_KEY);
    }
  }, [router]);

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
      sessionStorage.setItem(LOOKUP_STORAGE_KEY, JSON.stringify(response));

      redirectForResult(router, response);
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

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">Manage your booking</h1>
          <p className="mx-auto mt-[7px] max-w-[380px] text-[13.5px] leading-[1.55] text-muted">
            Look up your reservation with your booking ID and last name or email — then modify dates, swap vehicles, or view invoices.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 w-full rounded-2xl border border-card-border bg-white p-6"
        >
          {errors.general && (
            <div className="mb-5 rounded-[10px] bg-danger-bg px-4 py-3 text-[13px] text-danger-text">
              {errors.general}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-ink">Booking ID</label>
            <div className="mt-2 flex items-center gap-1 rounded-[10px] border border-line bg-white px-3 focus-within:border-primary">
              <span className="shrink-0 select-none text-[13px] font-semibold text-faint">BKG-</span>
              {/* ``flex-1 min-w-0`` lets the input share space with the
                  fixed prefix instead of forcing 100% width, which used
                  to push the "BKG-" out of the rounded border. */}
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value.replace(/^BKG\s*-?\s*/i, ''))}
                placeholder="Enter your booking number"
                className="flex-1 min-w-0 bg-transparent py-[10px] text-[13px] text-ink placeholder:text-faint focus:outline-none"
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
      </section>
    </div>
  );
}
