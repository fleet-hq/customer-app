'use client';

import { useMemo } from 'react';
import type { AgreementData, BonzahAddendum } from '@/services/agreementServices';
import { NA, money, num, milesLabel, overageLabel } from '@/lib/agreement-format';
import {
  formatBookingDate,
  formatBookingTime,
  formatCreatedDate,
} from '@/services/bookingServices';


export interface BookingAgreementInput {
  // Decimal fields arrive from the API as strings, so everything
  // numeric here is coerced before use rather than trusted.
  vehicle?: {
    name?: string;
    vin?: string;
    milesPerDay?: number | string;
    milesOverageRate?: number | string;
    extras?: { id: string; title: string; price: number | string; priceUnit: string }[];
  } | null;
  pricing: {
    subtotal: number;
    insuranceCost: number;
    extrasCost: number;
    locationCharges: number;
    discount: number;
    fleetDiscount: number;
    tax: number;
    total: number;
    deposit: number;
    bookingFee: number;
  };
  selectedExtras: Record<string, number>;
  customer: { firstName: string; lastName: string; phone: string; license: string };
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  /** UTC instants for the chosen trip. Preferred over the raw date/time
   *  strings so the agreement prints dates the same way the booked one
   *  does, in the rental location's timezone. */
  pickupIso?: string;
  dropoffIso?: string;
  company?: { name?: string; address?: string; email?: string; phone?: string; logo?: string | null } | null;
  tenantName: string;
  template?: { title?: string; description?: string; clauses?: { id: number; title: string; content: string }[] } | null;
  addendum?: BonzahAddendum | null;
  timezone?: string | null;
  insuranceLabel?: string;
  ownInsurance?: boolean;
  signature?: string | null;
}

/** The agreement exactly as it will read once the booking exists, built
 *  from what the customer has chosen so far. Fields that are only filled
 *  later — identity verification, policy numbers, the agreement number —
 *  stay blank rather than being invented, so the preview matches the
 *  document they sign afterwards. */
export function useBookingAgreementData(input: BookingAgreementInput): AgreementData {
  const {
    vehicle,
    pricing,
    selectedExtras,
    customer,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    pickupIso,
    dropoffIso,
    company,
    tenantName,
    template,
    addendum,
    timezone,
    insuranceLabel,
    ownInsurance,
    signature,
  } = input;

  return useMemo<AgreementData>(() => {
    const miles = milesLabel(vehicle);

    const insuranceCost = num(pricing.insuranceCost);
    const rentalTotal = num(pricing.subtotal) - insuranceCost - num(pricing.extrasCost);
    const fees = num(pricing.bookingFee) + num(pricing.locationCharges);
    const discount = num(pricing.discount) + num(pricing.fleetDiscount);
    const tax = num(pricing.tax);
    const deposit = num(pricing.deposit);
    const fullName = `${customer.firstName} ${customer.lastName}`.trim();

    return {
      id: 0,
      status: signature ? 'signed' : 'pending',
      signedAt: null,
      signatureImage: signature ?? null,
      timezone: timezone ?? null,
      company: {
        name: company?.name || tenantName,
        address: company?.address || NA,
        email: company?.email || NA,
        phone: company?.phone || NA,
        logo: company?.logo || null,
      },
      customer: {
        name: fullName || NA,
        homeAddress: NA,
        city: NA,
        state: NA,
        zip: NA,
        phone: customer.phone || NA,
        birthDate: NA,
        licenseNumber: customer.license || NA,
        licenseExpiry: NA,
      },
      secondaryDrivers: [],
      insurance: {
        carrierName: ownInsurance ? 'Own Insurance' : insuranceLabel || NA,
        policyNumber: NA,
        expires: NA,
        status: NA,
        policyDetails: ownInsurance
          ? 'Customer provided own insurance'
          : insuranceLabel || NA,
        premiumAmount: insuranceCost,
      },
      vehicle: {
        pickupDateTime: pickupIso
          ? `${formatBookingDate(pickupIso, timezone ?? undefined)} ${formatBookingTime(pickupIso, timezone ?? undefined)}`
          : `${pickupDate} ${pickupTime}`,
        dropoffDateTime: dropoffIso
          ? `${formatBookingDate(dropoffIso, timezone ?? undefined)} ${formatBookingTime(dropoffIso, timezone ?? undefined)}`
          : `${returnDate} ${returnTime}`,
        bookedAt: formatCreatedDate(new Date().toISOString()),
        vin: vehicle?.vin || NA,
        vehicleName: vehicle?.name || NA,
        minimumMiles: miles,
        maximumMiles: miles,
        overageFee: overageLabel(vehicle?.milesOverageRate),
        minDriverAge: null,
        maxDriverAge: null,
      },
      invoice: {
        rentalTotal: money(rentalTotal),
        fees: fees > 0 ? money(fees) : undefined,
        discount: discount > 0 ? `-${money(discount)}` : undefined,
        insurance: insuranceCost > 0 ? money(insuranceCost) : undefined,
        tax: tax > 0 ? money(tax) : undefined,
        total: money(pricing.total),
        deposit: deposit > 0 ? money(deposit) : undefined,
      },
      extras: (vehicle?.extras ?? []).map((e) => ({
        name: e.title,
        price: `${money(e.price)}${e.priceUnit}`,
        purchased: num(selectedExtras[e.id]) > 0,
        quantity: num(selectedExtras[e.id]),
      })),
      clauses: template?.clauses ?? [],
      addendum: addendum ?? null,
      template: {
        title: template?.title || 'Vehicle Rental Agreement',
        description:
          template?.description || 'Please review and sign this rental agreement before pickup.',
      },
    };
  }, [
    vehicle,
    pricing,
    selectedExtras,
    customer,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    pickupIso,
    dropoffIso,
    company,
    tenantName,
    template,
    addendum,
    timezone,
    insuranceLabel,
    ownInsurance,
    signature,
  ]);
}
