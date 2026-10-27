'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { paths } from '@/lib/paths';
import { setBookingToken } from '@/utils/booking-token';
import { lookupBooking, requestSignInLink, type BookingLookupResponse } from '@/services/bookingServices';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { extractApiErrorMessage } from '@/lib/api-errors';


export interface ManageLookupFormErrors {
  booking_id?: string;
  last_name?: string;
  email?: string;
  general?: string;
}

const LOOKUP_STORAGE_KEY = 'cc_lookup';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ManageLookupMode = 'details' | 'link';

function redirectForResult(router: ReturnType<typeof useRouter>, data: BookingLookupResponse, replace = false) {
  const go = replace ? router.replace : router.push;
  if (data.bookings.length === 1) {
    go(`${paths.booking(String(data.bookings[0].id))}?token=${data.booking_token}`);
  } else if (data.bookings.length > 1) {
    go(`${paths.bookings}?highlight=${data.searched_booking_id}`);
  }
}

/** Booking-lookup form state/logic shared by both templates' "manage
 *  your booking" pages so this booking-adjacent logic lives in exactly
 *  one place. Templates differ only in how they render what this
 *  returns. */
export function useManageLookup() {
  const tenant = useTenant();
  const router = useRouter();
  const signInToken = useSearchParams().get('token');
  const [mode, setMode] = useState<ManageLookupMode>('details');
  const [linkSent, setLinkSent] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<ManageLookupFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useDynamicTranslation([
    'Enter your booking number',
    'Enter your last name',
    'Enter your email address',
    'Looking up…',
    'Continue',
    'Booking ID is required.',
    'Please provide your last name or email address.',
    'Last name can only contain letters, spaces, hyphens, and apostrophes.',
    'Please enter a valid email address.',
    'No booking found. Please check your details and try again.',
    'Send me a sign-in link',
    'Sending…',
    'This sign-in link has expired. Request a new one.',
    'Something went wrong. Please try again.',
  ]);

  function openLookup(response: BookingLookupResponse, replace = false) {
    setBookingToken(response.booking_token);
    sessionStorage.setItem(LOOKUP_STORAGE_KEY, JSON.stringify(response));
    redirectForResult(router, response, replace);
  }

  function lookupErrors(err: unknown): ManageLookupFormErrors {
    return { general: extractApiErrorMessage(err, 'No booking found. Please check your details and try again.') };
  }

  useEffect(() => {
    if (!signInToken) return;
    setIsLoading(true);
    lookupBooking({ token: signInToken })
      .then((response) => openLookup(response, true))
      .catch((err) => {
        setMode('link');
        setErrors(lookupErrors(err));
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signInToken]);

  useEffect(() => {
    if (signInToken) return;
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
  }, [router, signInToken]);

  function validate(): ManageLookupFormErrors {
    const errs: ManageLookupFormErrors = {};
    if (!bookingId.trim()) {
      errs.booking_id = 'Booking ID is required.';
    }
    if (!lastName.trim() && !email.trim()) {
      errs.general = 'Please provide your last name or email address.';
    }
    if (lastName.trim() && !/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
      errs.last_name = 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
    }
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    return errs;
  }

  async function sendLink() {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrors({ email: email.trim() ? 'Please enter a valid email address.' : 'Enter your email address' });
      return;
    }
    setIsLoading(true);
    try {
      await requestSignInLink(email.trim());
      setLinkSent(true);
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(next: ManageLookupMode) {
    setErrors({});
    setLinkSent(false);
    setMode(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (mode === 'link') {
      await sendLink();
      return;
    }

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

      openLookup(response);
    } catch (err) {
      setErrors(lookupErrors(err));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    tenant,
    t,
    bookingId,
    setBookingId,
    lastName,
    setLastName,
    email,
    setEmail,
    errors,
    isLoading,
    handleSubmit,
    mode,
    switchMode,
    linkSent,
  };
}
