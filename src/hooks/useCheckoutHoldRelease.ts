'use client';

import { useCallback, useEffect, useRef } from 'react';
import { releaseCheckoutHold } from '@/services/bookingServices';

const STORAGE_KEY = 'fhq-active-checkout-hold';

type StoredHold = { pendingId: string; carId: string };

function readStored(): StoredHold | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredHold>;
    if (parsed?.pendingId && parsed?.carId) {
      return { pendingId: parsed.pendingId, carId: parsed.carId };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function clearStored() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useCheckoutHoldRelease(carId: string) {
  const pendingIdRef = useRef<string | null>(null);
  const suppressedRef = useRef(false);

  useEffect(() => {
    const stored = readStored();
    if (stored && stored.carId === carId) {
      releaseCheckoutHold(stored.pendingId);
      clearStored();
    }
  }, [carId]);

  useEffect(() => {
    const onPageHide = () => {
      if (suppressedRef.current) return;
      const pendingId = pendingIdRef.current;
      if (!pendingId) return;
      releaseCheckoutHold(pendingId);
      clearStored();
      pendingIdRef.current = null;
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, []);

  const registerHold = useCallback(
    (pendingId: string) => {
      pendingIdRef.current = pendingId;
      suppressedRef.current = false;
      try {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ pendingId, carId }),
        );
      } catch {
        /* ignore */
      }
    },
    [carId],
  );

  const suppressRelease = useCallback((opts?: { clear?: boolean }) => {
    suppressedRef.current = true;
    if (opts?.clear) {
      clearStored();
      pendingIdRef.current = null;
    }
  }, []);

  const releaseNow = useCallback(() => {
    const pendingId = pendingIdRef.current;
    if (pendingId) releaseCheckoutHold(pendingId);
    clearStored();
    pendingIdRef.current = null;
    suppressedRef.current = true;
  }, []);

  return { registerHold, suppressRelease, releaseNow };
}
