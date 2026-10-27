'use client';

import { SignaturePad } from '@/components/ui/signature-pad';
import { Dyn } from '@/components/i18n/Dyn';
import { DynHtml } from '@/components/i18n/DynHtml';
import type { AgreementData } from '@/services/agreementServices';
import { money } from '@/lib/utils';
import {
  DASH,
  dash,
  fmtDateLong,
  agreementNo,
  Paper,
  SectionTitle,
  SpecTable,
  ExtrasTable,
  Fill,
  type SpecRow,
  type RentalAgreementPreviewProps,
} from './agreement-primitives';

export function AgreementTemplate1({ data, onSignatureChange }: RentalAgreementPreviewProps) {
  const defaultData: AgreementData = {
    id: 0,
    status: 'pending',
    signedAt: null,
    signatureImage: null,
    company: {
      name: 'Company Name',
      address: 'Company Address',
      email: 'company@email.com',
      phone: '+1 (000) 000-0000',
      logo: null,
    },
    customer: {
      name: 'Customer Name',
      homeAddress: 'Customer Address',
      city: 'City',
      state: 'State',
      zip: '00000',
      phone: '+1 (000) 000-0000',
      birthDate: 'January 1, 1990',
      licenseNumber: 'XX-0000000',
      licenseExpiry: 'December 31, 2026',
    },
    insurance: {
      carrierName: 'Insurance Carrier',
      policyNumber: 'POL-000000',
      expires: 'December 31, 2026',
      policyDetails: 'Policy Details',
    },
    vehicle: {
      pickupDateTime: 'January 1, 2026 at 10:00 AM',
      dropoffDateTime: 'January 7, 2026 at 10:00 AM',
      bookedAt: 'December 25, 2025',
      vin: '0000000000000000',
      vehicleName: '2024 Vehicle Name',
      minimumMiles: 'Unlimited',
      maximumMiles: 'Unlimited',
      overageFee: '$0.00',
    },
    invoice: {
      rentalTotal: '$0.00',
      total: '$0.00',
    },
    clauses: [],
    template: {
      title: 'Rental Agreement',
      description: '',
    },
  };

  const d = data || defaultData;
  const c = d.customer;
  const v = d.vehicle;

  const renterAddress =
    [c.homeAddress, [c.city, c.state, c.zip].filter((x) => x && x !== 'N/A').join(', ')]
      .filter((x) => x && x !== 'N/A')
      .join(', ') || null;

  const driverAge =
    c == null
      ? DASH
      : v.minDriverAge != null && v.maxDriverAge != null
        ? `${v.minDriverAge} – ${v.maxDriverAge} years`
        : v.minDriverAge != null
          ? `Minimum ${v.minDriverAge} years`
          : v.maxDriverAge != null
            ? `Maximum ${v.maxDriverAge} years`
            : 'No restriction';

  const ongoing = d.ongoingTerms;
  const rentalTerm: SpecRow[] = [
    ['Pickup Date & Time', dash(v.pickupDateTime)],
    ...(ongoing ? ongoing.term : [['Dropoff Date & Time', dash(v.dropoffDateTime)] as SpecRow]),
    ['Booking Date', dash(v.bookedAt)],
  ];

  const vehicleSpecs: SpecRow[] = [
    ['Vehicle Name', dash(v.vehicleName)],
    ['VIN', dash(v.vin)],
    ['Minimum Miles', dash(v.minimumMiles)],
    ['Maximum Miles', dash(v.maximumMiles)],
    ['Overage Fees', dash(v.overageFee)],
    ['Driver Age Requirement', driverAge],
  ];

  const feeRows: SpecRow[] = ongoing ? [...ongoing.fees] : [];
  if (!ongoing && d.invoice) {
    feeRows.push(['Rental Total', dash(d.invoice.rentalTotal)]);
    if (d.invoice.fees) feeRows.push(['Booking Fees', d.invoice.fees]);
    if (d.invoice.discount) feeRows.push(['Discount', d.invoice.discount]);
    if (d.invoice.insurance) feeRows.push(['Insurance', d.invoice.insurance]);
    if (d.invoice.tax) feeRows.push(['Tax', d.invoice.tax]);
    feeRows.push(['Total', dash(d.invoice.total)]);
    if (d.invoice.deposit) feeRows.push(['Security Deposit', d.invoice.deposit]);
  }

  const driverDetails: SpecRow[] = [
    ['Customer Name', dash(c.name)],
    ['Home Address', dash(c.homeAddress)],
    ['City', dash(c.city)],
    ['State', dash(c.state)],
    ['Zip', dash(c.zip)],
    ['Phone', dash(c.phone)],
    ['Birth Date', dash(c.birthDate)],
    ['Drivers License Number', dash(c.licenseNumber)],
    ['Driver license Expiry Date', dash(c.licenseExpiry)],
  ];

  // Card on file. Masked by construction — brand, last four and expiry are
  // all the provider ever hands back, and the charge runs off its saved-card
  // handle, so a number or CVV is neither available nor needed here.
  const card = d.cardOnFile;
  const authorizationRow: SpecRow = [
    'Authorization',
    card?.authorized
      ? card.consentedAt
        ? `Authorized ${fmtDateLong(card.consentedAt, d.timezone)}`
        : 'Authorized'
      : '—',
  ];
  // Stripe Link and its kind have no brand, number or expiry to print —
  // asking for them produced an agreement listing a Card Number of "—".
  // Name the method instead; the rows that cannot be filled are omitted
  // rather than shown empty.
  const cardRows: SpecRow[] = !card
    ? []
    : card.isCard
      ? [
          ['Cardholder Name', dash(card.cardholderName)],
          ['Card Type', dash(card.brandLabel)],
          ['Card Number', dash(card.maskedNumber)],
          ['Expiration', dash(card.expiry)],
          authorizationRow,
        ]
      : [
          ['Name on Account', dash(card.cardholderName)],
          ...(card.methodLabel
            ? ([['Payment Method', card.methodLabel]] as SpecRow[])
            : []),
          ...(card.methodDetail
            ? ([['Account', card.methodDetail]] as SpecRow[])
            : []),
          authorizationRow,
        ];

  const insuranceRows: SpecRow[] = [
    ['Carrier Name', dash(d.insurance.carrierName)],
    ['Policy Number', dash(d.insurance.policyNumber)],
    ['Expires', dash(d.insurance.expires)],
    ['Policy Details', dash(d.insurance.policyDetails)],
  ];
  if (d.insurance.premiumAmount) {
    insuranceRows.push(['Premium', money(d.insurance.premiumAmount)]);
  }
  if (d.insurance.status && d.insurance.status !== 'N/A') {
    insuranceRows.push(['Status', d.insurance.status]);
  }

  const companyAddressLines = [d.company.address].filter((x) => x && x !== 'N/A');
  const issued = dash(v.bookedAt);

  return (
    <div className="rounded-xl bg-[#F5F7F9] p-3 sm:p-6 print:bg-white print:p-0">
      <div className="max-w-[820px] mx-auto space-y-5 text-[#131314]">
        <Paper className="pt-10 pb-14">
          <div className="pb-8 sm:pb-12 border-b border-[#F2F3F6]">
            <div className="flex flex-row items-start justify-between gap-4 sm:gap-6">
              <div className="flex items-start gap-4 min-w-0 flex-1 sm:flex-initial">
                {d.company.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.company.logo}
                    alt=""
                    className="h-14 w-14 rounded-md object-cover border border-[#EEEEEE]"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-[#EAEAEA]" />
                )}
                <div className="font-normal text-[10px] leading-none text-[#515151] min-w-0">
                  <p className="font-bold text-[12px] sm:text-[14px] tracking-tight-2 text-[#131314] mb-3 break-words">
                    {d.company.name}
                  </p>
                  <div className="space-y-1 break-words">
                    {companyAddressLines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    {(d.company.phone || d.company.email) && (
                      <p>
                        {dash(d.company.phone) !== DASH ? d.company.phone : ''}
                        {dash(d.company.phone) !== DASH && dash(d.company.email) !== DASH && (
                          <span className="mx-1.5">·</span>
                        )}
                        {dash(d.company.email) !== DASH ? d.company.email : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right font-normal text-[10px] leading-none text-[#515151] shrink-0">
                <p className="font-bold text-[10px] text-[#131314] mb-1.5"><Dyn>Vehicle Rental Agreement</Dyn></p>
                <div className="space-y-2">
                  <p>
                    <span><Dyn>Agreement No.</Dyn></span>{' '}
                    <span className="font-bold text-[#131314]">{agreementNo(d.id)}</span>
                  </p>
                  <p>
                    <span><Dyn>Issued</Dyn></span> <span className="font-bold text-[#131314]">{issued}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <SectionTitle className="mt-12"><Dyn>Parties</Dyn></SectionTitle>
          <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
            This Car Rental Agreement (hereinafter referred to as the{' '}
            <b className="font-bold">“Rental Agreement”</b>) is entered into on{' '}
            <Fill value={issued !== DASH ? issued : null} w={28} /> (the{' '}
            <b className="font-bold">“Effective Date”</b>), by and between{' '}
            <Fill value={dash(d.company.name) !== DASH ? d.company.name : null} w={36} />, with an address of{' '}
            <Fill value={companyAddressLines[0] || null} w={28} /> (hereinafter referred to as the{' '}
            <b className="font-bold">“Owner”</b>) and{' '}
            <Fill value={dash(c.name) !== DASH ? c.name : null} w={24} /> with an address of{' '}
            <Fill value={renterAddress} w={28} /> (hereinafter referred to as the{' '}
            <b className="font-bold">“Renter”</b>) (collectively referred to as the{' '}
            <b className="font-bold">“Parties”</b>).
          </p>
          <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
            <Dyn>This contract outlines the respective rights and obligations of the Parties.</Dyn>
          </p>

          <SectionTitle className="mt-10"><Dyn>RENTAL TERM</Dyn></SectionTitle>
          <SpecTable rows={rentalTerm} />

          <SectionTitle className="mt-10"><Dyn>RENTAL VEHICLE SPECIFICATIONS</Dyn></SectionTitle>
          <SpecTable rows={vehicleSpecs} />

          {d.extras && d.extras.length > 0 && (
            <>
              <SectionTitle className="mt-10"><Dyn>EXTRAS</Dyn></SectionTitle>
              <ExtrasTable rows={d.extras} />
            </>
          )}

          <SectionTitle className="mt-10"><Dyn>RENTAL FEES</Dyn></SectionTitle>
          {feeRows.length > 0 ? (
            <SpecTable rows={feeRows} />
          ) : (
            <p className="mt-3 text-[12px] leading-[1.6] text-slate-400 text-center">{DASH}</p>
          )}
        </Paper>

        <Paper>
          <SectionTitle className="mt-10"><Dyn>Driver Details</Dyn></SectionTitle>
          <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
            <Dyn>No additional authorized driver without our prior written consent.</Dyn>
          </p>
          <div className="mt-4">
            <SpecTable rows={driverDetails} />
          </div>

          {(d.secondaryDrivers ?? []).map((sd, i) => (
            <div key={i} className="mt-8">
              <SectionTitle className="mt-10"><Dyn>{`Additional Driver ${i + 1}`}</Dyn></SectionTitle>
              <div className="mt-4">
                <SpecTable
                  rows={[
                    ['Driver Name', dash(sd.name)],
                    ['Home Address', dash(sd.homeAddress)],
                    ['City', dash(sd.city)],
                    ['State', dash(sd.state)],
                    ['Zip', dash(sd.zip)],
                    ['Phone', dash(sd.phone)],
                    ['Birth Date', dash(sd.birthDate)],
                    ['Drivers License Number', dash(sd.licenseNumber)],
                    ['Driver license Expiry Date', dash(sd.licenseExpiry)],
                  ]}
                />
              </div>
            </div>
          ))}

          {card ? (
            <>
              <SectionTitle className="mt-10">
                <Dyn>{card && !card.isCard ? 'Payment Method on File' : 'Card on File'}</Dyn>
              </SectionTitle>
              <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
                <Dyn>
                  {card && !card.isCard
                    ? 'This payment method is kept on file for tolls, tickets, fuel, cleaning or damage arising during or after the rental. It is stored by our payment provider — we never hold the account details.'
                    : 'This card is kept on file for tolls, tickets, fuel, cleaning or damage arising during or after the rental. It is stored by our payment provider — we never hold the card number or security code.'}
                </Dyn>
              </p>
              <div className="mt-4">
                <SpecTable rows={cardRows} />
              </div>
              {d.cardClause ? (
                <div
                  className="mt-4 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314] [&_p]:mt-2! [&_p:first-child]:mt-0!"
                  dangerouslySetInnerHTML={{ __html: d.cardClause.content }}
                />
              ) : null}
            </>
          ) : null}

          <SectionTitle className="mt-10"><Dyn>INSURANCE</Dyn></SectionTitle>
          <SpecTable rows={insuranceRows} />

          <SectionTitle className="mt-10"><Dyn>Terms &amp; Conditions</Dyn></SectionTitle>
          <div className="mt-4 space-y-5">
            {d.clauses.length === 0 ? (
              <p className="text-[12px] leading-[1.6] text-slate-400 text-center">
                <Dyn>No clauses have been activated yet.</Dyn>
              </p>
            ) : (
              d.clauses.map((clause, index) => (
                <div key={clause.id} className="clause-block">
                  <h4 className="font-bold text-[12px] tracking-tight-2 text-[#131314] mb-2">
                    {index + 1}. <Dyn>{clause.title}</Dyn>
                  </h4>
                  <DynHtml
                    html={clause.content}
                    className="text-[12px] leading-[1.6] text-[#131314] prose prose-sm max-w-none"
                  />
                </div>
              ))
            )}
          </div>
        </Paper>

        {d.addendum && d.addendum.sections.length > 0 && (
          <Paper>
            <SectionTitle className="mt-10"><Dyn>{d.addendum.title}</Dyn></SectionTitle>
            <div className="mt-4 space-y-5">
              {d.addendum.sections.map((sec, index) => (
                <div key={index} className="clause-block">
                  <h4 className="font-bold text-[12px] tracking-tight-2 text-[#131314] mb-2">
                    {index + 1}. <Dyn>{sec.heading}</Dyn>
                  </h4>
                  <p className="text-[12px] leading-[1.6] text-[#131314]"><Dyn>{sec.body}</Dyn></p>
                </div>
              ))}
            </div>
          </Paper>
        )}

        <Paper>
          <SectionTitle className="mt-10"><Dyn>SIGNATURE AND DATE</Dyn></SectionTitle>
          <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
            <b className="font-bold"><Dyn>IN WITNESS WHEREOF</Dyn></b><Dyn>, the parties have executed this Vehicle Rental Agreement as of the date first written above. By signing, the renter party acknowledges that they have read, understand, and agree to be bound by all terms and conditions contained herein.</Dyn>
          </p>

          <div className="mt-8">
            <p className="font-bold text-[12px] tracking-tight-2 text-[#131314] mb-2"><Dyn>Renter&apos;s Signature</Dyn></p>
            {d.signatureImage ? (
              <>
                <div className="w-[200px] h-20 border border-[#E0E0E0] flex items-center justify-center p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.signatureImage} alt="" className="max-w-full max-h-full object-contain" />
                </div>
                <p className="mt-3 text-[12px] text-[#131314]">
                  <span className="text-[#7D7D7D]"><Dyn>Signed</Dyn></span>{' '}
                  <span className="font-bold text-[#131314] ml-1">
                    {fmtDateLong(d.signedAt, d.timezone)}
                  </span>
                </p>
              </>
            ) : (
              <SignaturePad label="" onSignatureChange={onSignatureChange} />
            )}
          </div>
        </Paper>
      </div>
    </div>
  );
}
