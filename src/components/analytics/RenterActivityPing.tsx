'use client';

import { useEffect } from 'react';

const VISITOR_KEY = 'cc_visitor_id';
const SENT_KEY = 'cc_ract_sent';

function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function RenterActivityPing({
  companyId,
  domain,
}: {
  companyId?: string | number;
  domain?: string;
}) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SENT_KEY)) return;
    } catch {
      return;
    }

    const visitorId = getVisitorId();
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!visitorId || !base) return;

    fetch(`${base}/api/dashboard/renter-activity/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        domain,
        visitor_id: visitorId,
      }),
      keepalive: true,
    })
      .then(() => {
        try {
          sessionStorage.setItem(SENT_KEY, '1');
        } catch {
          return;
        }
      })
      .catch(() => {});
  }, [companyId, domain]);

  return null;
}
