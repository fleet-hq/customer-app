'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { paths } from '@/lib/paths';
import {
  useAgreementByBooking,
  useCompanySettings,
  useDefaultAgreementTemplate,
  useBonzahAddendum,
} from '@/hooks/useAgreements';
import { useBookingDetails } from '@/hooks/useBooking';
import { submitBookingSignature, toAgreementExtras, type AgreementData } from '@/services/agreementServices';
import { setBookingToken } from '@/utils/booking-token';

/** All /rental-agreement (index, no id) data, state, and handlers —
 *  shared verbatim by both templates. Mechanical extraction of what
 *  used to be inline in page.tsx; nothing about the logic has changed.
 *  Resolves an agreement three ways, in priority order once a
 *  `bookingId` is present: the freshly-fetched booking (`fallbackAgreement`,
 *  merged with any API-signed state), the API agreement, then a
 *  `localStorage`-persisted draft from before the booking existed. */
export function useRentalAgreementIndex() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = searchParams.get('bookingId');
  const urlToken = searchParams.get('token');

  const [localAgreementData, setLocalAgreementData] = useState<AgreementData | null>(null);
  const [localDataLoaded, setLocalDataLoaded] = useState(false);
  const [tokenReady, setTokenReady] = useState(!urlToken);
  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationModal, setValidationModal] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (urlToken) {
      setBookingToken(urlToken);
      setTokenReady(true);
    }
  }, [urlToken]);

  useEffect(() => {
    const stored = localStorage.getItem('pendingAgreement');
    if (stored) {
      try {
        setLocalAgreementData(JSON.parse(stored) as AgreementData);
      } catch {
        // ignore corrupted local copy
      }
    }
    setLocalDataLoaded(true);
  }, []);

  const { data: apiAgreement, isLoading: apiLoading } = useAgreementByBooking(
    tokenReady && bookingId ? bookingId : undefined,
  );

  const needsFallback = !!(bookingId && localDataLoaded);
  const { data: bookingData, isLoading: bookingLoading } = useBookingDetails(
    needsFallback ? bookingId : undefined,
  );
  const { data: companySettings, isLoading: companyLoading } = useCompanySettings();
  const { data: agreementTemplate, isLoading: templateLoading } = useDefaultAgreementTemplate();
  const { data: bonzahAddendum } = useBonzahAddendum();

  const fallbackAgreement = useMemo<AgreementData | null>(() => {
    if (!needsFallback || !bookingData) return null;

    return {
      id: 0,
      status: 'pending',
      signedAt: null,
      signatureImage: null,
      company: {
        name: companySettings?.name || 'N/A',
        address: companySettings?.address || 'N/A',
        email: companySettings?.email || 'N/A',
        phone: companySettings?.phone || 'N/A',
        logo: companySettings?.logo || null,
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
        carrierName: bookingData.insuranceCoverage
          ? 'Bonzah Insurance'
          : bookingData.hasOwnInsurance
            ? 'Own Insurance'
            : 'N/A',
        policyNumber: bookingData.insuranceCoverage?.policyId || 'N/A',
        expires: 'N/A',
        status: bookingData.insuranceCoverage?.status || 'N/A',
        policyDetails: bookingData.insuranceCoverage
          ? [
              bookingData.insuranceCoverage.cdw && 'Collision Damage Waiver (CDW)',
              bookingData.insuranceCoverage.rcli && 'Rental Car Liability (RCLI)',
              bookingData.insuranceCoverage.sli && 'Supplemental Liability (SLI)',
              bookingData.insuranceCoverage.pai && 'Personal Accident (PAI)',
            ]
              .filter(Boolean)
              .join(', ')
          : bookingData.hasOwnInsurance
            ? 'Customer provided own insurance'
            : 'N/A',
        premiumAmount: bookingData.insuranceCoverage?.premiumAmount || 0,
      },
      vehicle: {
        pickupDateTime: `${bookingData.pickUp.date} ${bookingData.pickUp.time}`,
        dropoffDateTime: `${bookingData.dropOff.date} ${bookingData.dropOff.time}`,
        bookedAt: bookingData.bookedOn,
        vin: bookingData.vehicle.vin,
        vehicleName: bookingData.vehicle.name,
        minimumMiles: bookingData.vehicle.milesUnlimited
          ? 'Unlimited'
          : (bookingData.vehicle.milesPerDay ?? 0) > 0
            ? `${bookingData.vehicle.milesPerDay} miles/day`
            : 'N/A',
        maximumMiles: bookingData.vehicle.milesUnlimited
          ? 'Unlimited'
          : (bookingData.vehicle.milesPerDay ?? 0) > 0
            ? `${bookingData.vehicle.milesPerDay} miles/day`
            : 'N/A',
        overageFee:
          (bookingData.vehicle.milesOverageRate ?? 0) > 0
            ? `$${bookingData.vehicle.milesOverageRate!.toFixed(2)}/mile`
            : '$0.00',
        minDriverAge: bookingData.vehicle.minDriverAge ?? null,
        maxDriverAge: bookingData.vehicle.maxDriverAge ?? null,
      },
      invoice: {
        rentalTotal:
          bookingData.invoice.items[0]?.unit === 'hour'
            ? `$${bookingData.invoice.rentalTotal.toFixed(2)} (${bookingData.invoice.items[0].quantity} hrs × $${bookingData.invoice.items[0].pricePerDay.toFixed(2)}/hr)`
            : `$${bookingData.invoice.rentalTotal.toFixed(2)}`,
        fees: bookingData.invoice.fees > 0 ? `$${bookingData.invoice.fees.toFixed(2)}` : undefined,
        discount:
          bookingData.invoice.discount > 0 ? `-$${bookingData.invoice.discount.toFixed(2)}` : undefined,
        insurance: bookingData.insuranceCoverage
          ? `$${bookingData.insuranceCoverage.premiumAmount.toFixed(2)} (${[
              bookingData.insuranceCoverage.cdw && 'CDW',
              bookingData.insuranceCoverage.rcli && 'RCLI',
              bookingData.insuranceCoverage.sli && 'SLI',
              bookingData.insuranceCoverage.pai && 'PAI',
            ]
              .filter(Boolean)
              .join(', ')})`
          : undefined,
        tax: bookingData.invoice.tax > 0 ? `$${bookingData.invoice.tax.toFixed(2)}` : undefined,
        total: `$${bookingData.invoice.total.toFixed(2)}`,
        deposit:
          bookingData.invoice.deposit > 0 ? `$${bookingData.invoice.deposit.toFixed(2)}` : undefined,
      },
      clauses: agreementTemplate?.clauses || [],
      template: {
        title: agreementTemplate?.title || 'Vehicle Rental Agreement',
        description:
          agreementTemplate?.description || 'Please review and sign this rental agreement before pickup.',
      },
    };
  }, [needsFallback, bookingData, companySettings, agreementTemplate]);

  const baseAgreement = bookingId
    ? fallbackAgreement
      ? {
          ...fallbackAgreement,
          signatureImage: apiAgreement?.signatureImage ?? fallbackAgreement.signatureImage,
          signedAt: apiAgreement?.signedAt ?? fallbackAgreement.signedAt,
          status: apiAgreement?.signatureImage ? 'signed' : fallbackAgreement.status,
        }
      : apiAgreement || localAgreementData
    : localAgreementData || apiAgreement || fallbackAgreement;

  const agreement = useMemo(() => {
    if (!baseAgreement) return baseAgreement;
    const signedSnapshot = apiAgreement?.fromSnapshot ? apiAgreement : null;
    const coverage = bookingData?.insuranceCoverage;
    const hasIssuedBonzah =
      !!coverage && (coverage.status === 'ACTIVE' || coverage.status === 'EXPIRED');
    const addendum = signedSnapshot
      ? signedSnapshot.addendum ?? null
      : hasIssuedBonzah && bonzahAddendum
        ? bonzahAddendum
        : null;
    const extras = signedSnapshot
      ? signedSnapshot.extras
      : bookingData?.availableExtras
        ? toAgreementExtras(bookingData.availableExtras)
        : baseAgreement.extras;
    const clauses = signedSnapshot?.clauses ?? baseAgreement.clauses;
    if (!companySettings) return { ...baseAgreement, addendum, extras, clauses };
    return {
      ...baseAgreement,
      addendum,
      extras,
      clauses,
      company: {
        name: companySettings.name || baseAgreement.company?.name || 'N/A',
        address: companySettings.address || baseAgreement.company?.address || 'N/A',
        email: companySettings.email || baseAgreement.company?.email || 'N/A',
        phone: companySettings.phone || baseAgreement.company?.phone || 'N/A',
        logo: companySettings.logo || baseAgreement.company?.logo || null,
      },
    };
  }, [baseAgreement, companySettings, bookingData, bonzahAddendum, apiAgreement]);

  const isLoading =
    !localDataLoaded ||
    !tokenReady ||
    (!!bookingId && apiLoading) ||
    (needsFallback && (bookingLoading || companyLoading || templateLoading));

  const handleAccept = async () => {
    if (!signature || !agree || isSaving) return;
    setError('');

    if (bookingId) {
      setIsSaving(true);
      try {
        await submitBookingSignature(bookingId, signature);
        queryClient.setQueryData(
          ['agreement-by-booking', bookingId],
          (prev: AgreementData | null | undefined) => ({
            ...(prev ?? {}),
            signatureImage: signature,
            signedAt: new Date().toISOString(),
            status: 'signed',
          }),
        );
        queryClient.invalidateQueries({ queryKey: ['agreement-by-booking', bookingId] });
      } catch (e: unknown) {
        setIsSaving(false);
        const status = (e as { response?: { status?: number } })?.response?.status;
        const isAuth = status === 401 || status === 403;
        setValidationModal({
          isOpen: true,
          title: isAuth ? 'Session Expired' : "We Couldn't Save Your Signature",
          message: isAuth
            ? "We couldn't verify your booking — please re-open this page from the link we emailed you and try again."
            : 'Something went wrong saving your signature. Check your connection and try again, or re-open this page from the link we emailed you.',
        });
        return;
      } finally {
        setIsSaving(false);
      }
    }

    if (localAgreementData) {
      const signedAgreement: AgreementData = {
        ...localAgreementData,
        status: 'signed',
        signatureImage: signature,
        signedAt: new Date().toISOString(),
      };
      localStorage.setItem('pendingAgreement', JSON.stringify(signedAgreement));
    }

    if (bookingId) {
      router.push(paths.booking(bookingId));
    } else {
      router.back();
    }
  };

  const isSigned = !!agreement && (agreement.status === 'signed' || !!agreement.signatureImage);

  return {
    bookingId,
    agreement,
    isLoading,
    agree,
    setAgree,
    signature,
    setSignature,
    isSaving,
    error,
    validationModal,
    setValidationModal,
    handleAccept,
    isSigned,
  };
}
