'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DOMPurify from 'dompurify';
import { BackLink } from '@/components/ui/back-link';
import { Download, Check } from '@/components/ui/icons';
import { useTenant } from '@/lib/tenant-context';
import { withCompany } from '@/lib/tenant';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import {
  useAgreementByBooking,
  useDefaultAgreementTemplate,
  useCompanySettings,
} from '@/hooks/useAgreements';
import { useBookingDetails } from '@/hooks/useBooking';
import { submitBookingSignature, type AgreementData } from '@/services/agreementServices';
import { setBookingToken } from '@/utils/booking-token';
import { RentalAgreementPreview } from '@/components/booking/rental-agreement-preview';

interface Section {
  heading: string;
  html?: string;
  paras?: string[];
}

function TermsSkeleton() {
  return (
    <div className="flex flex-col gap-9" aria-busy="true" aria-label="Loading terms">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-[14px]">
          <div className="h-[18px] w-[220px] rounded-md bg-subtle animate-pulse" />
          <div className="h-[14px] w-full rounded bg-subtle animate-pulse" />
          <div className="h-[14px] w-[92%] rounded bg-subtle animate-pulse" />
          <div className="h-[14px] w-[85%] rounded bg-subtle animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function SectionBlock({ sec }: { sec: Section }) {
  return (
    <div>
      <h2 className="mb-[14px] text-[17px] font-semibold text-primary">{sec.heading}</h2>
      {sec.html !== undefined ? (
        <div
          className="flex flex-col gap-[14px] text-[15px] font-light leading-[1.75] text-label [&_li]:ml-5 [&_li]:list-disc"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sec.html) }}
        />
      ) : (
        <div className="flex flex-col gap-[14px]">
          {sec.paras?.map((text, i) => (
            <p key={i} className="whitespace-pre-line text-[15px] font-light leading-[1.75] text-label">
              {text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function TermsContent() {
  const router = useRouter();
  const tenant = useTenant();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const urlToken = searchParams.get('token');

  const [tokenReady, setTokenReady] = useState(!urlToken);
  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlToken) {
      setBookingToken(urlToken);
      setTokenReady(true);
    }
  }, [urlToken]);

  const isBound = !!bookingId;

  const ready = isBound && tokenReady;
  const { data: bookingData, isLoading: bookingLoading, isError: bookingError } = useBookingDetails(
    ready ? bookingId! : undefined,
  );
  const { data: apiAgreement } = useAgreementByBooking(ready ? bookingId! : undefined);
  const { data: company } = useCompanySettings();
  const { data: template, isLoading: templateLoading } = useDefaultAgreementTemplate();

  const agreement = useMemo<AgreementData | null>(() => {
    if (!isBound || !bookingData) return null;
    const ins = bookingData.insuranceCoverage;
    const miles = bookingData.vehicle.milesUnlimited
      ? 'Unlimited'
      : (bookingData.vehicle.milesPerDay ?? 0) > 0
        ? `${bookingData.vehicle.milesPerDay} miles/day`
        : 'N/A';
    return {
      id: apiAgreement?.id ?? 0,
      status: apiAgreement?.signatureImage ? 'signed' : 'pending',
      signedAt: apiAgreement?.signedAt ?? null,
      signatureImage: apiAgreement?.signatureImage ?? null,
      timezone: bookingData.timezone ?? null,
      company: {
        name: company?.name || tenant.name,
        address: company?.address || 'N/A',
        email: company?.email || 'N/A',
        phone: company?.phone || 'N/A',
        logo: company?.logo || null,
      },
      customer: {
        name: bookingData.customer.name,
        homeAddress: bookingData.customer.homeAddress || 'N/A',
        city: bookingData.customer.city || 'N/A',
        state: bookingData.customer.state || 'N/A',
        zip: bookingData.customer.zip || 'N/A',
        phone: bookingData.customer.phone,
        birthDate: bookingData.customer.dob || 'N/A',
        licenseNumber: bookingData.customer.licenseNumber || 'N/A',
        licenseExpiry: bookingData.customer.licenseExpiry || 'N/A',
      },
      insurance: {
        carrierName: ins ? 'Bonzah Insurance' : bookingData.hasOwnInsurance ? 'Own Insurance' : 'N/A',
        policyNumber: ins?.policyId || 'N/A',
        expires: 'N/A',
        status: ins?.status || 'N/A',
        policyDetails: ins
          ? [ins.cdw && 'CDW', ins.rcli && 'RCLI', ins.sli && 'SLI', ins.pai && 'PAI'].filter(Boolean).join(', ')
          : bookingData.hasOwnInsurance
            ? 'Customer provided own insurance'
            : 'N/A',
        premiumAmount: ins?.premiumAmount || 0,
      },
      vehicle: {
        pickupDateTime: `${bookingData.pickUp.date} ${bookingData.pickUp.time}`,
        dropoffDateTime: `${bookingData.dropOff.date} ${bookingData.dropOff.time}`,
        bookedAt: bookingData.bookedOn,
        vin: bookingData.vehicle.vin,
        vehicleName: bookingData.vehicle.name,
        minimumMiles: miles,
        maximumMiles: miles,
        overageFee:
          (bookingData.vehicle.milesOverageRate ?? 0) > 0
            ? `$${bookingData.vehicle.milesOverageRate!.toFixed(2)}/mile`
            : '$0.00',
        minDriverAge: bookingData.vehicle.minDriverAge ?? null,
        maxDriverAge: bookingData.vehicle.maxDriverAge ?? null,
      },
      invoice: {
        rentalTotal: `$${bookingData.invoice.rentalTotal.toFixed(2)}`,
        fees: bookingData.invoice.fees > 0 ? `$${bookingData.invoice.fees.toFixed(2)}` : undefined,
        discount: bookingData.invoice.discount > 0 ? `-$${bookingData.invoice.discount.toFixed(2)}` : undefined,
        insurance: ins ? `$${ins.premiumAmount.toFixed(2)}` : undefined,
        tax: bookingData.invoice.tax > 0 ? `$${bookingData.invoice.tax.toFixed(2)}` : undefined,
        total: `$${bookingData.invoice.total.toFixed(2)}`,
        deposit: bookingData.invoice.deposit > 0 ? `$${bookingData.invoice.deposit.toFixed(2)}` : undefined,
      },
      clauses: template?.clauses ?? [],
      template: {
        title: template?.title || 'Vehicle Rental Agreement',
        description: template?.description || 'Please review and sign this rental agreement before pickup.',
      },
    };
  }, [isBound, bookingData, apiAgreement, company, template, tenant.name]);

  if (isBound) {
    const backHref = `${paths.booking(bookingId!)}?token=${urlToken ?? ''}`;
    const isSigned = !!agreement?.signatureImage;

    const accept = async () => {
      if (!signature || !agree || saving) return;
      setSaving(true);
      setError('');
      try {
        await submitBookingSignature(bookingId!, signature);
        router.push(backHref);
      } catch {
        setSaving(false);
        setError('We could not save your signature. Please try again, or re-open this page from the link we emailed you.');
      }
    };

    if (!tokenReady || bookingLoading) {
      return (
        <div className="flex min-h-screen flex-col bg-white text-ink">
          <section className="mx-auto flex w-full max-w-[1000px] flex-1 items-center justify-center px-6 py-24">
            <p className="text-sm text-faint">Loading agreement&hellip;</p>
          </section>
        </div>
      );
    }

    if (bookingError || !agreement) {
      return (
        <div className="flex min-h-screen flex-col bg-white text-ink">
          <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
            <BackLink href={backHref}>Go Back</BackLink>
            <div className="mt-12 text-center">
              <h1 className="text-[22px] font-semibold text-secondary">Agreement not found</h1>
              <p className="mt-3 text-[14px] font-light text-faint">
                We couldn&apos;t load this booking. Please re-open the agreement from the link we emailed you.
              </p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
          <BackLink href={backHref}>Go Back</BackLink>

          <div className="mt-[14px] mb-7 flex items-start justify-between gap-6">
            <div className="max-w-[720px]">
              <h1 className="text-[26px] font-semibold text-secondary">{agreement.template.title}</h1>
              <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">{agreement.template.description}</p>
            </div>
            <button className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white">
              <Download size={15} /> Download PDF
            </button>
          </div>

          <RentalAgreementPreview data={agreement} onSignatureChange={setSignature} />

          {error && <p className="mx-auto mt-4 max-w-[820px] text-xs text-danger">{error}</p>}

          {isSigned ? (
            <div className="mx-auto mt-6 flex max-w-[820px] items-center gap-2 rounded-[10px] border border-green-border-2 bg-green-bg px-4 py-3 text-[13px] font-medium text-success">
              <Check size={16} strokeWidth={3} /> This agreement has been signed.
            </div>
          ) : (
            <div className="mx-auto mt-6 flex max-w-[820px] flex-wrap items-center justify-between gap-[14px]">
              <label onClick={() => setAgree((a) => !a)} className="flex max-w-[520px] cursor-pointer items-start gap-3">
                <span
                  className={cn(
                    'mt-px inline-flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                    agree ? 'border-primary bg-primary' : 'border-control bg-white',
                  )}
                >
                  {agree && <Check size={12} strokeWidth={3} className="text-white" />}
                </span>
                <span className="text-[13px] leading-[1.6] text-label">
                  I have read and agree to the <span className="font-semibold text-ink">{agreement.template.title}</span>{' '}
                  set out above, including the insurance, fuel, mileage and cancellation provisions.
                </span>
              </label>
              <button
                type="button"
                disabled={!signature || !agree || saving}
                onClick={accept}
                className={cn(
                  'ml-auto rounded-[9px] px-8 py-3 text-sm font-semibold text-white',
                  signature && agree && !saving ? 'bg-primary' : 'cursor-not-allowed bg-primary-disabled',
                )}
              >
                {saving ? 'Saving…' : 'Sign & Accept'}
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  const title = 'Terms and Conditions';
  const intro =
    template?.description ||
    'Our fleet is clean, reliable, and ready for the road. Please review the agreement below before confirming your reservation — no surprises, no hidden fees.';
  const sections: Section[] = templateLoading
    ? []
    : template && template.clauses.length > 0
    ? template.clauses.map((c) => ({ heading: c.title, html: c.content }))
    : DEFAULT_TERMS_SECTIONS.map((sec) => ({
        heading: sec.heading,
        paras: sec.paras.map((p) => withCompany(p, tenant.name)),
      }));

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">
        <BackLink href={paths.home}>Go Back</BackLink>

        <div className="mt-[14px] flex items-start justify-between gap-6">
          <div className="max-w-[720px]">
            <h1 className="text-[26px] font-semibold text-secondary">{title}</h1>
            <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">{intro}</p>
          </div>
          <button className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white">
            <Download size={15} /> Download PDF
          </button>
        </div>

        <div className="my-7 h-px bg-hairline" />

        {templateLoading ? (
          <TermsSkeleton />
        ) : (
          <div className="flex flex-col gap-9">
            {sections.map((sec) => (
              <SectionBlock key={sec.heading} sec={sec} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <TermsContent />
    </Suspense>
  );
}

/** Fallback terms used when a tenant has no rental-agreement template
 *  configured. Until per-tenant terms editing ships in the super-admin
 *  dashboard this gives every site a sensible baseline. */
const DEFAULT_TERMS_SECTIONS: { heading: string; paras: string[] }[] = [
  {
    heading: '1. Eligibility & Driver Requirements',
    paras: [
      "To rent a vehicle from {company}, the primary driver must be at least 21 years of age and hold a valid, unexpired driver's license. Drivers between 21 and 24 may be subject to a standard Young Driver surcharge, which will be disclosed clearly at the time of booking.",
      "All drivers must provide proof of active automobile insurance and a valid form of payment in the renter's name.",
    ],
  },
  {
    heading: '2. Reservations & Payment',
    paras: [
      'A reservation is confirmed once a deposit has been authorized against the payment method provided. The renter must be the cardholder and may be asked to present the physical card at pickup.',
      'Rates quoted include the base daily rate and any extras you select. Applicable taxes and fees, where they apply, are itemized on your invoice before you confirm.',
    ],
  },
  {
    heading: '3. Insurance, Protection & Liability',
    paras: [
      'Renters may provide their own qualifying insurance or select one of our protection plans at checkout. The renter is responsible for the vehicle for the full duration of the rental.',
      'Any incident, accident, or mechanical issue must be reported to {company} immediately.',
    ],
  },
  {
    heading: '4. Fuel, Mileage & Returns',
    paras: [
      'Vehicles are supplied with a full tank of fuel and must be returned full unless the Prepaid Fuel option was purchased.',
      "Vehicles must be returned to the agreed drop-off location at the scheduled time. Late returns may incur an additional day's charge.",
    ],
  },
  {
    heading: '5. Cancellations & Modifications',
    paras: [
      'Reservations may be cancelled or modified through your booking dashboard. Cancellations made within the free-cancellation window are fully refundable.',
    ],
  },
];
