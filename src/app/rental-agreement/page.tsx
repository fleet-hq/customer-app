'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { BackLink } from '@/components/ui/back-link';
import { Download, Check } from '@/components/ui/icons';
import { ValidationModal } from '@/components/ui/validation-modal';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import {
  useAgreementByBooking,
  useCompanySettings,
  useDefaultAgreementTemplate,
} from '@/hooks/useAgreements';
import { useBookingDetails } from '@/hooks/useBooking';
import { RentalAgreementPreview } from '@/components/booking/rental-agreement-preview';
import {
  submitBookingSignature,
  type AgreementData,
} from '@/services/agreementServices';
import { setBookingToken } from '@/utils/booking-token';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-8 pb-16">{children}</section>
    </div>
  );
}

function RentalAgreementIndex() {
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
    if (!companySettings) return baseAgreement;
    return {
      ...baseAgreement,
      company: {
        name: companySettings.name || baseAgreement.company?.name || 'N/A',
        address: companySettings.address || baseAgreement.company?.address || 'N/A',
        email: companySettings.email || baseAgreement.company?.email || 'N/A',
        phone: companySettings.phone || baseAgreement.company?.phone || 'N/A',
        logo: companySettings.logo || baseAgreement.company?.logo || null,
      },
    };
  }, [baseAgreement, companySettings]);

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

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="text-sm text-faint">Loading agreement&hellip;</p>
        </div>
      </Shell>
    );
  }

  if (bookingId && !agreement) {
    return (
      <Shell>
        <BackLink href={paths.home}>Go Back</BackLink>
        <div className="mt-12 text-center">
          <h1 className="text-[22px] font-semibold text-secondary">Agreement not found</h1>
          <p className="mt-3 text-[14px] font-light text-faint">
            No agreement found for this booking. Please contact support.
          </p>
        </div>
      </Shell>
    );
  }

  if (!agreement) {
    return (
      <Shell>
        <BackLink href={paths.home}>Go Back</BackLink>
        <div className="mt-12 text-center">
          <h1 className="text-[22px] font-semibold text-secondary">Agreement not found</h1>
          <p className="mt-3 text-[14px] font-light text-faint">
            The agreement you are looking for does not exist.
          </p>
        </div>
      </Shell>
    );
  }

  const isSigned = agreement.status === 'signed' || !!agreement.signatureImage;

  return (
    <>
      <Shell>
        <BackLink href={bookingId ? paths.booking(bookingId) : paths.home}>Go Back</BackLink>

        <div className="mt-[14px] mb-7 flex items-start justify-between gap-6">
          <div className="max-w-[720px]">
            <h1 className="text-[26px] font-semibold text-secondary">{agreement.template.title}</h1>
            <p className="mt-[10px] text-[13px] font-light leading-[1.55] text-faint">
              {agreement.template.description}
            </p>
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
            <label
              onClick={() => setAgree((a) => !a)}
              className="flex max-w-[520px] cursor-pointer items-start gap-3"
            >
              <span
                className={cn(
                  'mt-px inline-flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]',
                  agree ? 'border-primary bg-primary' : 'border-control bg-white',
                )}
              >
                {agree && <Check size={12} strokeWidth={3} className="text-white" />}
              </span>
              <span className="text-[13px] leading-[1.6] text-label">
                I have read and agree to the{' '}
                <span className="font-semibold text-ink">{agreement.template.title}</span> set out above,
                including the insurance, fuel, mileage and cancellation provisions.
              </span>
            </label>
            <button
              type="button"
              disabled={!signature || !agree || isSaving}
              onClick={handleAccept}
              className={cn(
                'ml-auto rounded-[9px] px-8 py-3 text-sm font-semibold text-white',
                signature && agree && !isSaving ? 'bg-primary' : 'cursor-not-allowed bg-primary-disabled',
              )}
            >
              {isSaving ? 'Saving…' : 'Sign & Accept'}
            </button>
          </div>
        )}
      </Shell>

      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal({ isOpen: false, title: '', message: '' })}
        title={validationModal.title}
        message={validationModal.message}
      />
    </>
  );
}

export default function RentalAgreementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RentalAgreementIndex />
    </Suspense>
  );
}
