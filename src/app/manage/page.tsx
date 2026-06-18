'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight } from '@/components/ui/icons';
import { cn, money } from '@/lib/utils';
import { BOOKING_SUMMARIES, DEMO_USER, type BookingStatus } from '@/lib/mock-data';
import { paths } from '@/lib/paths';

const TABS = ['Upcoming', 'Past', 'Cancelled'];

const STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-green-bg-2 text-success' },
  pending: { label: 'Payment pending', className: 'bg-amber-bg text-amber-text-2' },
  cancelled: { label: 'Cancelled', className: 'bg-danger-bg text-danger-text' },
};

export default function ManageBookingsPage() {
  const [tab, setTab] = useState('Upcoming');

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header active="" signedIn userName={DEMO_USER.name} userEmail={DEMO_USER.email} />
      <section className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">My Bookings</h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          View and manage your reservations — modify dates, swap vehicles, or check your invoices.
        </p>

        <div className="mt-6 inline-flex items-center gap-1 rounded-[12px] border border-card-border bg-subtle p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-[9px] px-[16px] py-[8px] text-[13px] font-semibold transition-colors',
                tab === t ? 'bg-white text-secondary shadow-[var(--shadow-card)]' : 'text-muted hover:text-ink',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {BOOKING_SUMMARIES.map((b) => {
            const meta = STATUS_META[b.status];
            return (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-5 rounded-2xl border border-card-border bg-white p-5"
              >
                <div
                  className="h-[68px] w-[96px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url('${b.image}')` }}
                />
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-faint">Booking #{b.id}</span>
                    <span className={cn('rounded-full px-[9px] py-[3px] text-[10px] font-semibold', meta.className)}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="my-[3px] text-[16px] font-semibold text-secondary">{b.vehicleName}</div>
                  <div className="text-[12.5px] text-muted">{b.location} · {b.dates}</div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-[10px]">
                  <div className="text-right">
                    <div className="text-[10px] text-faint">Total</div>
                    <div className="text-[17px] font-bold text-secondary">{money(b.total)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.status === 'pending' && (
                      <Link
                        href={paths.paymentPending(b.id)}
                        className="rounded-[9px] bg-primary px-[16px] py-[9px] text-[12.5px] font-semibold text-white hover:bg-primary-hover"
                      >
                        Pay now
                      </Link>
                    )}
                    <Link
                      href={paths.booking(b.id)}
                      className="inline-flex items-center gap-[6px] rounded-[9px] border border-line bg-white px-[16px] py-[9px] text-[12.5px] font-semibold text-ink"
                    >
                      View details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
    </div>
  );
}
