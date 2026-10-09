'use client';

import { useMemo } from 'react';
import { useBookingDrivers } from '@/hooks/useBooking';
import {
  useAgreementByBooking,
  useBonzahAddendum,
  useCompanySettings,
  useDefaultAgreementTemplate,
} from '@/hooks/useAgreements';
import {
  agreementPartsFromSnapshot,
  mapCardOnFile,
  toAgreementExtras,
  type AgreementData,
} from '@/services/agreementServices';
import { useTenant } from '@/lib/tenant-context';
import { milesLabel, overageLabel } from '@/lib/agreement-format';
import type { BookingDetails } from '@/services/bookingServices';

/** The whole rental agreement for a booking, ready to render or sign.
 *
 *  Built from the booking rather than from a signature row, because an
 *  unsigned booking has no signature row — and a modal handed nothing
 *  falls back to showing the clauses alone, which is the old
 *  clauses-only document the renter should never see again.
 *
 *  A signed booking reads its frozen snapshot instead, so the document
 *  stays what was presented at signing.
 */
export function useAgreementDocument(
  bookingId: string | undefined,
  bookingData: BookingDetails | undefined,
): AgreementData | null {
  const tenant = useTenant();
  const { data: apiAgreement } = useAgreementByBooking(bookingId);
  const { data: bookingDrivers } = useBookingDrivers(bookingId);
  const { data: company } = useCompanySettings();
  const { data: template } = useDefaultAgreementTemplate();
  const { data: bonzahAddendum } = useBonzahAddendum();
  const isBound = !!bookingId;

  const agreement = useMemo<AgreementData | null>(() => {
    if (!isBound || !bookingData) return null;
    const ins = bookingData.insuranceCoverage;
    const signedSnapshot = apiAgreement?.fromSnapshot ? apiAgreement : null;
    const miles = milesLabel(bookingData.vehicle);
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
        overageFee: overageLabel(bookingData.vehicle.milesOverageRate),
        minDriverAge: bookingData.vehicle.minDriverAge ?? null,
        maxDriverAge: bookingData.vehicle.maxDriverAge ?? null,
      },
      // A signed agreement shows the card frozen at signing; otherwise the
      // booking's current one, so the renter sees it in the document they
      // are about to sign. Same precedence as invoice above.
      // Signed shows the card frozen at signing; otherwise the booking's
      // current one, so the renter sees it in the document they sign.
      cardOnFile:
        signedSnapshot?.cardOnFile ?? mapCardOnFile(bookingData.cardOnFile),
      invoice: signedSnapshot?.invoice ?? {
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
  return agreement;
}
