'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBookingBySession, BookingNotReadyYet } from '@/services/bookingServices';
import { setBookingToken } from '@/utils/booking-token';
import { paths } from '@/lib/paths';

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 10;

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const [phase, setPhase] = useState<'loading' | 'processing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

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

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          {phase !== 'error' ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-ink">
                {phase === 'processing' ? 'Finalising your booking…' : 'Confirming payment…'}
              </h1>
              <p className="text-sm text-muted">
                {phase === 'processing'
                  ? 'Stripe is processing your payment. This usually takes just a moment.'
                  : 'One second while we set up your reservation.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-semibold text-ink">Something went wrong</h1>
              <p className="mb-6 text-sm text-muted">{errorMessage}</p>
              <button
                onClick={() => router.replace(paths.home)}
                className="rounded-[10px] bg-primary px-6 py-3 text-sm font-semibold text-white"
              >
                Back to home
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SuccessContent />
    </Suspense>
  );
}
