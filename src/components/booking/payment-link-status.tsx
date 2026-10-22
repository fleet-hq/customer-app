'use client';

import { Check, Clock, Close, Info } from '@/components/ui/icons';

import { Dyn } from '@/components/i18n/Dyn';
import { cn, money } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import { useTenant } from '@/lib/tenant-context';
import { telHref } from '@/lib/seo';
import type { LinkView } from '@/hooks/use-booking-payment';

interface PaymentLinkStatusProps {
  view: Exclude<LinkView, 'pay'>;
  amount: number;
  covers: string;
  cardLast4?: string | null;
  onRetry: () => void;
  retrying: boolean;
}

const COPY: Record<PaymentLinkStatusProps['view'], { title: string; body: string }> = {
  processing: { title: 'Processing your payment…', body: 'This page updates as soon as your bank confirms it.' },
  paid: { title: 'Paid', body: 'Your receipt has been emailed.' },
  already_paid: { title: 'Already paid', body: 'Nothing more is due for this payment.' },
  expired: { title: 'This payment link has expired', body: 'Contact us for a new link.' },
  failed: { title: 'Your payment didn’t go through', body: 'No money was taken. You can try again.' },
};

export function PaymentLinkStatus({ view, amount, covers, cardLast4, onRetry, retrying }: PaymentLinkStatusProps) {
  const isT2 = useIsT2();
  const tenant = useTenant();
  const { phone, email } = tenant.footer.contact;
  const good = view === 'paid' || view === 'already_paid';
  const bad = view === 'expired' || view === 'failed';
  const Icon = good ? Check : view === 'processing' ? Clock : view === 'failed' ? Close : Info;
  const tone = good
    ? isT2 ? 'text-[var(--success)]' : 'text-success'
    : bad
      ? isT2 ? 'text-[var(--danger)]' : 'text-danger'
      : isT2 ? 'text-[var(--brass)]' : 'text-primary';
  const strong = isT2 ? 'text-[var(--text)]' : 'text-ink';
  const quiet = isT2 ? 'text-[var(--text-muted)]' : 'text-muted';
  const tel = telHref(phone);

  return (
    <section
      role="status"
      className={cn(
        'rounded-[14px] border p-5',
        isT2 ? 'border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
      )}
    >
      <div className={cn('flex items-center gap-2 text-[16px] font-semibold', tone)}>
        <Icon size={18} strokeWidth={2} />
        <Dyn>{COPY[view].title}</Dyn>
      </div>
      <p className={cn('mt-2 text-[24px] font-bold tracking-tight-2', strong)}>{money(amount)}</p>
      {covers ? <p className={cn('mt-1 text-[12px]', quiet)}><Dyn>{covers}</Dyn></p> : null}
      <p className={cn('mt-3 text-[13px] leading-[1.5]', quiet)}><Dyn>{COPY[view].body}</Dyn></p>
      {view === 'paid' && cardLast4 ? (
        <p className={cn('mt-1 text-[13px]', quiet)}>
          <Dyn>Card ending</Dyn> {cardLast4} <Dyn>saved</Dyn>
        </p>
      ) : null}
      {view === 'expired' && (phone || email) ? (
        <div className={cn('mt-3 flex flex-col gap-1 text-[13px] font-medium', strong)}>
          <span>{tenant.name}</span>
          {phone ? (tel ? <a href={tel}>{phone}</a> : <span>{phone}</span>) : null}
          {email ? <a href={`mailto:${email}`}>{email}</a> : null}
        </div>
      ) : null}
      {view === 'failed' ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={cn(
            'mt-4 w-full rounded-lg px-5 py-[11px] text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-60',
            isT2 ? 'bg-[var(--brass)] text-[var(--paper)]' : 'bg-primary text-white hover:bg-primary-hover',
          )}
        >
          <Dyn>{retrying ? 'Redirecting…' : 'Try again'}</Dyn>
        </button>
      ) : null}
    </section>
  );
}
