'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { IdCard, ShieldCheck } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  mapInsuranceVerificationDetails,
  isInsuranceVerified,
  isInsuranceFailed,
  type BookingDriver,
  type InsuranceVerificationDetails,
} from '@/services/bookingServices';
import {
  createDriverIdVerificationSession,
  createDriverInsuranceVerification,
} from '@/services/verificationServices';
import { FailedInsurancePanel } from '@/components/booking/failed-insurance-panel';

function DriverVerifyCard({
  icon,
  title,
  description,
  verified,
  failed,
  failureDetails,
  onVerify,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  verified: boolean;
  failed?: boolean;
  failureDetails?: InsuranceVerificationDetails | null;
  onVerify: () => Promise<string | null>;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleClick = () => {
    if (failed) {
      setDetailsOpen((v) => !v);
      return;
    }
    if (verified || loading) return;
    setError(null);
    setLoading(true);
    // Open the tab synchronously to keep the user-gesture context (async
    // window.open inside the promise gets popup-blocked).
    const win = window.open('', '_blank');
    onVerify()
      .then((url) => {
        if (!url) {
          win?.close();
          setError('Could not start verification. Please try again.');
          return;
        }
        setSent(true);
        if (win && !win.closed) {
          try {
            win.opener = null;
          } catch {
            /* cross-origin write after nav — safe to swallow */
          }
          win.location.href = url;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      })
      .catch(() => {
        win?.close();
        setError('Verification failed. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const label = failed
    ? detailsOpen
      ? 'Hide details'
      : 'View details'
    : verified
      ? 'Verified'
      : loading
        ? 'Sending…'
        : sent
          ? 'In progress…'
          : 'Verify';

  const pillCopy = failed ? 'Not verified' : verified ? 'Verified' : 'Required';

  const buttonDisabled = !failed && (verified || loading || sent);

  return (
    <div className="flex flex-col rounded-xl border border-card-border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chip">{icon}</div>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10.5px] font-semibold',
            failed
              ? 'bg-[#FEF3F2] text-[#B42318]'
              : verified
                ? 'bg-green-bg-2 text-success'
                : 'bg-amber-bg text-amber-text-2',
          )}
        >
          {pillCopy}
        </span>
      </div>
      <div className="mt-3 flex-1">
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={buttonDisabled}
        className={cn(
          'mt-4 w-full rounded-[9px] py-2.5 text-center text-[12.5px] font-semibold transition-colors',
          failed
            ? 'bg-[#FEF3F2] text-[#B42318] hover:bg-[#FEE4E2]'
            : verified
              ? 'cursor-default bg-green-bg-2 text-success'
              : buttonDisabled
                ? 'cursor-not-allowed bg-track text-muted'
                : 'bg-secondary text-white hover:opacity-90',
        )}
      >
        {label}
      </button>
      {failed && detailsOpen && failureDetails && (
        <FailedInsurancePanel details={failureDetails} />
      )}
      {error && <p className="mt-2 text-[11.5px] text-danger">{error}</p>}
    </div>
  );
}

export default function SecondaryDriverVerification({
  drivers,
  bookingId,
  rentalStartDate,
  rentalEndDate,
}: {
  drivers: BookingDriver[];
  bookingId: number | string;
  rentalStartDate: string;
  rentalEndDate: string;
}) {
  if (!drivers.length) return null;

  return (
    <div className="rounded-2xl border border-card-border bg-white p-5 sm:p-6">
      <p className="text-[15px] font-semibold text-ink">Additional drivers</p>
      <p className="mt-1 text-[12.5px] leading-[1.5] text-muted">
        Each additional driver verifies their own ID and insurance.
      </p>
      <div className="mt-4 space-y-5">
        {drivers.map((d) => {
          const insDetails = mapInsuranceVerificationDetails(d.insurance_verification);
          const insVerified = isInsuranceVerified(insDetails?.status, insDetails);
          const insFailed = isInsuranceFailed(insDetails?.status, insDetails);
          return (
          <div key={d.id}>
            <p className="text-[13px] font-semibold text-ink">{d.full_name}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <DriverVerifyCard
                icon={<IdCard size={18} className="text-muted" />}
                title="ID verification"
                description="Confirm this driver's identity with a government ID."
                verified={!!d.identity_verified}
                onVerify={() =>
                  createDriverIdVerificationSession(bookingId, d.id).then((r) => r.url)
                }
              />
              <DriverVerifyCard
                icon={<ShieldCheck size={18} className="text-muted" />}
                title="Insurance verification"
                description="Confirm this driver's insurance coverage."
                verified={insVerified}
                failed={insFailed}
                failureDetails={insDetails}
                onVerify={() =>
                  createDriverInsuranceVerification(
                    bookingId,
                    d.id,
                    rentalStartDate,
                    rentalEndDate,
                  ).then((r) => r.magicLink)
                }
              />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
