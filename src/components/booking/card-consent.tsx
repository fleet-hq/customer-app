'use client';

import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';

interface CardConsentProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  companyName: string;
  /** Deposit the renter will be asked for, so the notice can say what
   *  actually happens rather than a generic line. */
  depositAmount?: number;
  /** Charged up front and refunded, rather than held on the card. */
  depositChargedUpfront?: boolean;
  /** PRD E8.6 makes consent mandatory at website checkout; E8.5 lets a
   *  renter paying a link decline and pay anyway. */
  required?: boolean;
  /** Shown once they've tried to continue without ticking. */
  showError?: boolean;
}

const money = (n: number) => `$${n.toFixed(2)}`;

/** The authorization a renter gives before their card is kept for
 *  incidentals, plus what happens to their deposit.
 *
 *  Both are rendered here because they are the same question to a
 *  renter — "what can you take from my card, and when" — and splitting
 *  them is how people end up consenting to one while reading the other.
 *  The wording is versioned server-side (payments/card_consent.py); the
 *  copy here must stay in step with the current version. */
export function CardConsent({
  checked,
  onChange,
  companyName,
  depositAmount,
  depositChargedUpfront = false,
  required = false,
  showError = false,
}: CardConsentProps) {
  const hasDeposit = typeof depositAmount === 'number' && depositAmount > 0;

  return (
    <div className="mt-4 rounded-[10px] border border-line bg-white p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={showError || undefined}
          className="mt-[3px] h-[15px] w-[15px] flex-shrink-0 accent-primary"
        />
        <span className="text-[12.5px] leading-[1.6] text-ink">
          <Dyn>
            {`I authorize ${companyName} to charge this card for tolls, tickets, fuel, cleaning or damage during or after my rental, as described in the`}
          </Dyn>{' '}
          <a
            href={paths.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline"
          >
            <Dyn>Rental Agreement</Dyn>
          </a>
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </span>
      </label>

      {showError ? (
        <p className="mt-2 pl-[27px] text-[11.5px] font-medium text-danger">
          <Dyn>Please authorize this before continuing.</Dyn>
        </p>
      ) : null}

      <p className="mt-3 border-t border-line pt-3 pl-[27px] text-[11.5px] leading-[1.6] text-faint">
        {hasDeposit ? (
          depositChargedUpfront ? (
            <Dyn>
              {`${money(depositAmount!)} security deposit is charged at checkout and refunded after the vehicle is returned and inspected.`}
            </Dyn>
          ) : (
            <Dyn>
              {`${money(depositAmount!)} held on your card at pick-up, released after inspection.`}
            </Dyn>
          )
        ) : (
          <Dyn>No security deposit.</Dyn>
        )}
      </p>
    </div>
  );
}
