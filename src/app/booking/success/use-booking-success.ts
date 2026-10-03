'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBookingBySession, BookingNotReadyYet } from '@/services/bookingServices';
import { setBookingToken } from '@/utils/booking-token';
import { trackPurchase } from '@/lib/tracking-events';
import { paths } from '@/lib/paths';
import { useEmbedBridge } from '@/hooks';
import { useTenant } from '@/lib/tenant-context';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 10;

/** All booking-success polling/redirect data, state, and handlers —
 *  shared verbatim by both templates' success pages so this
 *  conversion-tracking logic lives in exactly one place (and fires
 *  exactly once). Templates differ only in how they render what this
 *  returns. This is a pure mechanical extraction of what used to be
 *  inline in page.tsx — nothing about the logic itself has changed. */
export function useBookingSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embed = useEmbedBridge();
  const tenant = useTenant();
  const sessionId = searchParams.get('session_id') || '';
  const [phase, setPhase] = useState<'loading' | 'processing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedRef = useRef(false);
  const { t } = useDynamicTranslation([
    'Finalising your booking…',
    'Confirming payment…',
    'Stripe is processing your payment. This usually takes just a moment.',
    'One second while we set up your reservation.',
    'Missing checkout session reference.',
    'Your payment is still processing. Refresh in a minute, or check your email for the booking confirmation.',
    'We could not load your booking. Please contact support.',
  ]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!sessionId) {
      setPhase('error');
      setErrorMessage('Missing checkout session reference.');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      while (!cancelled && attempts < MAX_ATTEMPTS) {
        attempts += 1;
        try {
          const booking = await getBookingBySession(sessionId);
          if (cancelled) return;
          if (booking.access_token) setBookingToken(booking.access_token);
          // Fire the conversion once, here — the success page is only ever
          // reached immediately after a completed checkout, so tenant GTM /
          // Meta Pixel conversions can't double-count on later booking views.
          trackPurchase({
            transactionId: booking.booking_id,
            value: Number(booking.total_price),
          });
          if (embed.embedded) embed.reportBookingComplete(booking.booking_id);
          router.replace(`${paths.booking(String(booking.booking_id))}?token=${encodeURIComponent(booking.access_token)}`);
          return;
        } catch (err) {
          if (err instanceof BookingNotReadyYet) {
            if (attempts < MAX_ATTEMPTS) {
              setPhase('processing');
              await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
              continue;
            }
            setPhase('error');
            setErrorMessage(
              'Your payment is still processing. Refresh in a minute, or check your email for the booking confirmation.',
            );
            return;
          }
          setPhase('error');
          setErrorMessage(
            err instanceof Error ? err.message : 'We could not load your booking. Please contact support.',
          );
          return;
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return { tenant, phase, errorMessage, t, router };
}
