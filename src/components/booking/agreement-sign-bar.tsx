'use client';

import { Check } from '@/components/ui/icons';
import { Dyn } from '@/components/i18n/Dyn';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';
import styles from '@/styles/template-2.module.css';

interface AgreementSignBarProps {
  signed: boolean;
  onOpen: () => void;
  className?: string;
}

/** "Sign Rental Agreement · required" — the bar beneath the booking
 *  button.
 *
 *  A renter meets this at checkout and again on their booking page, and
 *  the two looked nothing alike until they shared this. Both templates
 *  are handled here so neither page has to know which one it is in.
 */
export function AgreementSignBar({ signed, onOpen, className }: AgreementSignBarProps) {
  const isT2 = useTenant().websiteTemplate === 'template_2';

  if (isT2) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(styles.agreementBtn, signed && styles.agreementBtnSigned, className)}
      >
        <span>
          <Dyn>{signed ? 'Rental Agreement signed' : 'Sign Rental Agreement · required'}</Dyn>
        </span>
        {signed ? <Check size={14} strokeWidth={2.4} /> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border px-3 py-2 text-left transition-colors',
        signed
          ? 'border-green-border bg-green-bg hover:bg-green-bg-2'
          : 'border-primary-border bg-primary-soft hover:bg-primary-soft/70',
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            'inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
            signed ? 'border-success bg-success' : 'border-primary bg-white',
          )}
        >
          {signed && <Check size={11} strokeWidth={3.2} className="text-white" />}
        </span>
        <span className={cn('truncate text-[12px] font-semibold', signed ? 'text-success' : 'text-ink')}>
          <Dyn>{signed ? 'Rental Agreement signed' : 'Sign Rental Agreement · required'}</Dyn>
        </span>
      </span>
      {signed && (
        <span className="flex-shrink-0 whitespace-nowrap text-[11.5px] font-semibold text-success underline">
          <Dyn>Review</Dyn>
        </span>
      )}
    </button>
  );
}
