'use client';

import { useCallback, useEffect, useState } from 'react';

const KEYS = {
  hold: 'cc_hold_deadline',
  id: 'cc_id_verified',
  ins: 'cc_ins_verified',
  agreed: 'cc_agreement_signed',
} as const;

export const HOLD_MINUTES = 15;

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
  }
}

export function startHold() {
  write(KEYS.hold, String(Date.now() + HOLD_MINUTES * 60 * 1000));
  remove(KEYS.id);
  remove(KEYS.ins);
}

export function setIdVerified() {
  write(KEYS.id, 'true');
}

export function setInsVerified() {
  write(KEYS.ins, 'true');
}

export function setAgreementSigned() {
  write(KEYS.agreed, 'true');
}

export function useAgreementSigned(): boolean {
  const [signed, setSigned] = useState(false);
  useEffect(() => {
    setSigned(read(KEYS.agreed) === 'true');
  }, []);
  return signed;
}

export interface ConfirmState {
  secondsLeft: number;
  expired: boolean;
  idVerified: boolean;
  insVerified: boolean;
}

export function useConfirmState(): ConfirmState {
  const [secondsLeft, setSecondsLeft] = useState(HOLD_MINUTES * 60);
  const [idVerified, setId] = useState(false);
  const [insVerified, setIns] = useState(false);

  useEffect(() => {
    setId(read(KEYS.id) === 'true');
    setIns(read(KEYS.ins) === 'true');

    let deadline = parseInt(read(KEYS.hold) ?? '', 10);
    const now = Date.now();
    if (!deadline || isNaN(deadline) || deadline < now) {
      deadline = now + HOLD_MINUTES * 60 * 1000;
      write(KEYS.hold, String(deadline));
    }

    const tick = () => setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return { secondsLeft, expired: secondsLeft <= 0, idVerified, insVerified };
}

export function formatCountdown(secondsLeft: number): string {
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function resetVerification() {
  remove(KEYS.id);
  remove(KEYS.ins);
}

export function useMarkVerified(): { markId: () => void; markIns: () => void } {
  const markId = useCallback(() => setIdVerified(), []);
  const markIns = useCallback(() => setInsVerified(), []);
  return { markId, markIns };
}
