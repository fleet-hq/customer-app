'use client';

import { Dyn } from '@/components/i18n/Dyn';

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
}: CardConsentProps) {
  const hasDeposit = typeof depositAmount === 'number' && depositAmount > 0;

  return (
    <div className="mt-3 rounded-[10px] border border-line bg-white px-3.5 py-3">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-[2px] h-[14px] w-[14px] flex-shrink-0 accent-primary"
        />
        <span className="text-[11.5px] leading-[1.5] text-ink">
          {/* The agreement is on this same page, so the words stay words —
              a link here only invites the renter to navigate away from the
              thing they are part-way through. */}
          <Dyn>
            {`I authorize ${companyName} to charge this card for tolls, tickets, fuel, cleaning or damage during or after my rental, as described in the Rental Agreement.`}
          </Dyn>
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </span>
      </label>

      <p className="mt-1.5 pl-[24px] text-[11px] leading-[1.45] text-faint">
        {hasDeposit ? (
          depositChargedUpfront ? (
            <Dyn>
              {`${money(depositAmount!)} deposit charged at checkout, refunded after return and inspection.`}
            </Dyn>
          ) : (
            <Dyn>
              {`${money(depositAmount!)} held at pick-up, released after inspection.`}
            </Dyn>
          )
        ) : (
          <Dyn>No security deposit.</Dyn>
        )}
      </p>
    </div>
  );
}
