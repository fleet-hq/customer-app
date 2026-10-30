'use client';

import type { ReactNode } from 'react';

import { Dyn } from '@/components/i18n/Dyn';

export function fallbackConsentText(companyName: string) {
  return `By selecting the button below, I agree to the Rental Agreement and the terms and conditions, and authorize ${companyName || 'the rental company'} to charge my card for rental payments, the refundable security deposit, and any tolls, tickets, fuel, cleaning or damage during or after my rental.`;
}

export function reserveLabel({
  agreementRequired,
  agreementSigned,
  busy,
  label,
}: {
  agreementRequired: boolean;
  agreementSigned: boolean;
  busy: boolean;
  label: string;
}) {
  if (busy) return 'Starting checkout…';
  if (agreementRequired && !agreementSigned) return 'Sign the agreement to book';
  return label;
}

interface BookingAuthorizationProps {
  consentText: string;
  agreementRequired: boolean;
  agreementSigned: boolean;
  children?: ReactNode;
  headingClassName?: string;
  countClassName?: string;
  consentClassName?: string;
}

export function BookingAuthorization({
  consentText,
  agreementRequired,
  agreementSigned,
  children,
  headingClassName,
  countClassName,
  consentClassName = 'consent',
}: BookingAuthorizationProps) {
  return (
    <>
      {agreementRequired ? (
        <>
          <h5 className={headingClassName}>
            <span>
              <Dyn>To book</Dyn>
            </span>
            <span className={countClassName}>{agreementSigned ? '1 of 1' : '0 of 1'}</span>
          </h5>
          {children}
        </>
      ) : null}
      <p className={consentClassName}>
        <Dyn>{consentText}</Dyn>
      </p>
    </>
  );
}

interface EndingPolicyProps {
  heading: string;
  body: string;
  headingClassName?: string;
  bodyClassName?: string;
}

export function EndingPolicy({ heading, body, headingClassName, bodyClassName = 'policy' }: EndingPolicyProps) {
  return (
    <section>
      <h5 className={headingClassName}>
        <Dyn>{heading}</Dyn>
      </h5>
      <p className={bodyClassName}>
        <Dyn>{body}</Dyn>
      </p>
    </section>
  );
}
