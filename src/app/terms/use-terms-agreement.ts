'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/lib/tenant-context';
import { withCompany } from '@/lib/tenant';
import { paths } from '@/lib/paths';
import {
  useAgreementByBooking,
  useDefaultAgreementTemplate,
  useCompanySettings,
  useBonzahAddendum,
} from '@/hooks/useAgreements';
import { useBookingDetails, useBookingDrivers } from '@/hooks/useBooking';
import { submitBookingSignature, toAgreementExtras, type AgreementData } from '@/services/agreementServices';
import { setBookingToken } from '@/utils/booking-token';

export interface Section {
  heading: string;
  html?: string;
  paras?: string[];
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
      'A reservation is confirmed once the refundable security deposit has been charged to the payment method provided. The deposit is refunded after your return, minus any damages or fees. The renter must be the cardholder and may be asked to present the physical card at pickup.',
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

/** All /terms data, state, and handlers — shared verbatim by both
 *  templates' terms pages. This is a mechanical extraction of what
 *  used to be inline in page.tsx; nothing about the logic itself has
 *  changed. Covers both the booking-token-gated signature flow (when
 *  ``?bookingId=`` is present) and the static fallback terms shown
 *  otherwise. */
export function useTermsAgreement() {
  const router = useRouter();
  const tenant = useTenant();
  const queryClient = useQueryClient();
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
  const { data: bookingDrivers } = useBookingDrivers(ready ? bookingId! : undefined);
  const { data: company } = useCompanySettings();
  const { data: template, isLoading: templateLoading } = useDefaultAgreementTemplate();
  const { data: bonzahAddendum } = useBonzahAddendum();

  const agreement = useMemo<AgreementData | null>(() => {
    if (!isBound || !bookingData) return null;
    const ins = bookingData.insuranceCoverage;
    const signedSnapshot = apiAgreement?.fromSnapshot ? apiAgreement : null;
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
      secondaryDrivers: (bookingDrivers ?? []).map((dr) => {
        const iv = dr.identity_verification_details;
        return {
          name: dr.full_name || 'N/A',
          homeAddress: iv?.street_address_1 || 'N/A',
          city: iv?.city || 'N/A',
          state: iv?.state || 'N/A',
          zip: iv?.postal_code || 'N/A',
          phone: dr.phone || 'N/A',
          birthDate: iv?.dob || 'N/A',
          licenseNumber: iv?.document_number || 'N/A',
          licenseExpiry: iv?.document_expiration_date || 'N/A',
        };
      }),
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
      extras: signedSnapshot
        ? signedSnapshot.extras
        : toAgreementExtras(bookingData.availableExtras ?? []),
      clauses: signedSnapshot?.clauses ?? template?.clauses ?? [],
      addendum: signedSnapshot
        ? signedSnapshot.addendum ?? null
        : ins && (ins.status === 'ACTIVE' || ins.status === 'EXPIRED') && bonzahAddendum
          ? bonzahAddendum
          : null,
      template: {
        title: template?.title || 'Vehicle Rental Agreement',
        description: template?.description || 'Please review and sign this rental agreement before pickup.',
      },
    };
  }, [isBound, bookingData, apiAgreement, bookingDrivers, company, template, tenant.name, bonzahAddendum]);

  const backHref = `${paths.booking(bookingId!)}?token=${urlToken ?? ''}`;
  const isSigned = !!agreement?.signatureImage;

  const accept = async () => {
    if (!signature || !agree || saving) return;
    setSaving(true);
    setError('');
    try {
      await submitBookingSignature(bookingId!, signature);
      // Seed the agreement-by-booking cache with the fresh
      // signature and invalidate so the booking page renders the
      // "Rental agreement · Done" state on first paint after
      // navigation. Without this, the booking page mounted with
      // the old cached agreement (signatureImage: null) and the
      // customer had to hard-reload to see the row flip to signed.
      queryClient.setQueryData(
        ['agreement-by-booking', bookingId],
        (prev: AgreementData | null | undefined) => ({
          ...(prev ?? {}),
          signatureImage: signature,
          signedAt: new Date().toISOString(),
          status: 'signed',
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ['agreement-by-booking', bookingId],
      });
      router.push(backHref);
    } catch (e: unknown) {
      setSaving(false);
      const err = e as { response?: { status?: number; data?: Record<string, unknown> } };
      const status = err?.response?.status;
      const data = err?.response?.data;
      const detailFromData = ((): string | null => {
        if (!data || typeof data !== 'object') return null;
        const flat = Object.values(data).flat().filter((v) => typeof v === 'string') as string[];
        return flat.length ? flat.join(' ') : null;
      })();
      if (status === 400 && detailFromData?.toLowerCase().includes('already exists')) {
        router.push(backHref);
        return;
      }
      if (status === 401 || status === 403) {
        setError('Your booking link has expired. Please re-open this page from the link we emailed you.');
        return;
      }
      console.error('[submitBookingSignature] failed', { status, data });
      setError(
        detailFromData
          ? `We could not save your signature: ${detailFromData}`
          : 'We could not save your signature. Please try again, or re-open this page from the link we emailed you.',
      );
    }
  };

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

  return {
    tenant,
    isBound,
    tokenReady,
    bookingLoading,
    bookingError,
    agreement,
    agree,
    setAgree,
    signature,
    setSignature,
    saving,
    error,
    accept,
    backHref,
    isSigned,
    title,
    intro,
    sections,
    templateLoading,
  };
}
