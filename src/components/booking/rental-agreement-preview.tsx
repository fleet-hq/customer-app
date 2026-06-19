'use client';

import DOMPurify from 'dompurify';
import { SignaturePad } from '@/components/ui/signature-pad';
import type { AgreementData } from '@/services/agreementServices';

const DASH = '—';

function dash(v: unknown): string {
  if (v == null) return DASH;
  const s = String(v).trim();
  if (s === '' || s === 'N/A') return DASH;
  return s;
}

function fmtDateLong(iso?: string | null, timezone?: string | null): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dash(iso);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  });
}

function agreementNo(id?: number | null): string {
  if (id == null) return DASH;
  return `AGR-${String(id).padStart(3, '0')}`;
}

type SpecRow = [label: string, value: string];

function Paper({ children, className = 'pt-10 pb-14' }: { children: React.ReactNode; className?: string }) {
  return (
    <article
      className={`bg-white rounded-md shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.04)] px-5 sm:px-10 lg:px-14 print:shadow-none print:rounded-none print:px-0 ${className}`}
    >
      {children}
    </article>
  );
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`font-manrope font-bold text-[12px] sm:text-[14px] leading-tight tracking-tight-2 text-[#131314] text-center pb-4 ${className}`}
    >
      {children}
    </h2>
  );
}

function SpecTable({ rows }: { rows: SpecRow[] }) {
  return (
    <table className="w-full mt-3 border-collapse text-[10px] table-fixed">
      <colgroup>
        <col style={{ width: '30%' }} />
        <col style={{ width: '70%' }} />
      </colgroup>
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i}>
            <td className="border border-[#E0E0E0] px-3 py-2 text-[#5D5D5D]">{label}</td>
            <td className="border border-[#E0E0E0] px-3 py-2 font-bold text-[#131314]">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Fill({ value, w = 24 }: { value?: string | null; w?: number }) {
  return (
    <span
      className="inline-block align-baseline border-b border-black mx-0.5 text-center text-[#131314] leading-none px-1 font-bold"
      style={{ minWidth: `${w * 4}px` }}
    >
      {value || ' '}
    </span>
  );
}

interface RentalAgreementPreviewProps {
  data?: AgreementData;
  onSignatureChange?: (signature: string | null) => void;
}

export function RentalAgreementPreview({ data, onSignatureChange }: RentalAgreementPreviewProps) {
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

  const rentalTerm: SpecRow[] = [
    ['Pickup Date & Time', dash(v.pickupDateTime)],
    ['Dropoff Date & Time', dash(v.dropoffDateTime)],
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

  const feeRows: SpecRow[] = [];
  if (d.invoice) {
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

  const insuranceRows: SpecRow[] = [
    ['Carrier Name', dash(d.insurance.carrierName)],
    ['Policy Number', dash(d.insurance.policyNumber)],
    ['Expires', dash(d.insurance.expires)],
    ['Policy Details', dash(d.insurance.policyDetails)],
  ];
  if (d.insurance.premiumAmount) {
    insuranceRows.push(['Premium', `$${d.insurance.premiumAmount.toFixed(2)}`]);
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
                <p className="font-bold text-[10px] text-[#131314] mb-1.5">Vehicle Rental Agreement</p>
                <div className="space-y-2">
                  <p>
                    <span>Agreement No.</span>{' '}
                    <span className="font-bold text-[#131314]">{agreementNo(d.id)}</span>
                  </p>
                  <p>
                    <span>Issued</span> <span className="font-bold text-[#131314]">{issued}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <SectionTitle className="mt-12">Parties</SectionTitle>
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
            This contract outlines the respective rights and obligations of the Parties.
          </p>

          <SectionTitle className="mt-10">RENTAL TERM</SectionTitle>
          <SpecTable rows={rentalTerm} />

          <SectionTitle className="mt-10">RENTAL VEHICLE SPECIFICATIONS</SectionTitle>
          <SpecTable rows={vehicleSpecs} />

          <SectionTitle className="mt-8">RENTAL FEES</SectionTitle>
          {feeRows.length > 0 ? (
            <SpecTable rows={feeRows} />
          ) : (
            <p className="mt-3 text-[12px] leading-[1.6] text-slate-400 text-center">{DASH}</p>
          )}
        </Paper>

        <Paper>
          <SectionTitle>Driver Details</SectionTitle>
          <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
            No additional authorized driver without our prior written consent.
          </p>
          <div className="mt-4">
            <SpecTable rows={driverDetails} />
          </div>

          <SectionTitle className="mt-10">INSURANCE</SectionTitle>
          <SpecTable rows={insuranceRows} />

          <SectionTitle className="mt-10">Terms &amp; Conditions</SectionTitle>
          <div className="mt-4 space-y-5">
            {d.clauses.length === 0 ? (
              <p className="text-[12px] leading-[1.6] text-slate-400 text-center">
                No clauses have been activated yet.
              </p>
            ) : (
              d.clauses.map((clause, index) => (
                <div key={clause.id} className="clause-block">
                  <h4 className="font-bold text-[12px] tracking-tight-2 text-[#131314] mb-2">
                    {index + 1}. {clause.title}
                  </h4>
                  <div
                    className="text-[12px] leading-[1.6] text-[#131314] prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(clause.content) }}
                  />
                </div>
              ))
            )}
          </div>
        </Paper>

        <Paper>
          <SectionTitle>SIGNATURE AND DATE</SectionTitle>
          <p className="mt-3 text-[10px] sm:text-[12px] leading-[1.6] text-[#131314]">
            <b className="font-bold">IN WITNESS WHEREOF</b>, the parties have executed this Vehicle Rental
            Agreement as of the date first written above. By signing, the renter party acknowledges that they
            have read, understand, and agree to be bound by all terms and conditions contained herein.
          </p>

          <div className="mt-8">
            <p className="font-bold text-[12px] tracking-tight-2 text-[#131314] mb-2">Renter&apos;s Signature</p>
            {d.signatureImage ? (
              <>
                <div className="w-[200px] h-20 border border-[#E0E0E0] flex items-center justify-center p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.signatureImage} alt="" className="max-w-full max-h-full object-contain" />
                </div>
                <p className="mt-3 text-[12px] text-[#131314]">
                  <span className="text-[#7D7D7D]">Signed</span>{' '}
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
