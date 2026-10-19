'use client';

import { SignaturePad } from '@/components/ui/signature-pad';
import { Dyn } from '@/components/i18n/Dyn';
import { DynHtml } from '@/components/i18n/DynHtml';
import {
  DASH,
  dash,
  fmtDateLong,
  Paper,
  Fill,
  type RentalAgreementPreviewProps,
} from './agreement-primitives';

const BODY = 'text-[10px] sm:text-[12px] leading-[1.65] text-[#131314]';
const LABEL = 'text-[10px] sm:text-[11px] text-[#5D5D5D]';
const HEADING = '#1E3A8A';

function Clause({ children }: { children: React.ReactNode }) {
  return <p className={`${BODY} mt-2`}>{children}</p>;
}

function SectionHeading({ n, children }: { n: number; children: string }) {
  return (
    <div className="mt-7">
      <h3
        className="font-manrope font-bold text-[11px] sm:text-[13px] tracking-tight-2"
        style={{ color: HEADING }}
      >
        {n}. <Dyn>{children}</Dyn>
      </h3>
    </div>
  );
}

function SummaryHeading({ children }: { children: string }) {
  return (
    <div className="mt-6">
      <h4
        className="font-manrope font-bold text-[12px] sm:text-[16px] uppercase tracking-[0.08em] border-b border-[#E0E0E0] pb-1.5"
        style={{ color: HEADING }}
      >
        <Dyn>{children}</Dyn>
      </h4>
    </div>
  );
}

function FieldGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
      {rows.map(([label, value], i) => (
        <div key={i} className="flex items-baseline gap-2 min-w-0">
          <span className={`${LABEL} shrink-0`}>
            <Dyn>{label}</Dyn>:
          </span>
          <span className="flex-1 min-w-0 border-b border-[#C9C9C9] text-[10px] sm:text-[12px] font-bold text-[#131314] pb-0.5 break-words">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SignatureSlot({
  role,
  image,
  name,
  signedAt,
  timezone,
  onSignatureChange,
}: {
  role: string;
  image: string | null;
  name: string;
  signedAt: string | null;
  timezone?: string | null;
  onSignatureChange?: (signature: string | null) => void;
}) {
  return (
    <div className="mt-6">
      <p className="font-bold text-[11px] sm:text-[12px] tracking-tight-2 text-[#131314] mb-2">
        <Dyn>{role}</Dyn>
      </p>
      {image ? (
        <div className="w-[200px] h-20 border border-[#E0E0E0] flex items-center justify-center p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      ) : onSignatureChange ? (
        <SignaturePad label="" onSignatureChange={onSignatureChange} />
      ) : (
        <div className="w-[260px] border-b border-[#131314] h-10" />
      )}
      <div className="mt-3 flex flex-wrap gap-x-10 gap-y-2">
        <p className="text-[10px] sm:text-[12px] text-[#131314]">
          <span className="text-[#7D7D7D]"><Dyn>Date</Dyn></span>{' '}
          <span className="font-bold ml-1">{signedAt ? fmtDateLong(signedAt, timezone) : DASH}</span>
        </p>
        <p className="text-[10px] sm:text-[12px] text-[#131314]">
          <span className="text-[#7D7D7D]"><Dyn>Print Name</Dyn></span>{' '}
          <span className="font-bold ml-1">{dash(name)}</span>
        </p>
      </div>
    </div>
  );
}

export function AgreementTemplate2({ data, onSignatureChange }: RentalAgreementPreviewProps) {
  if (!data) return null;

  const d = data;
  const c = d.customer;
  const v = d.vehicle;
  const owner = d.owner;

  const renterAddress =
    [c.homeAddress, [c.city, c.state, c.zip].filter((x) => x && x !== 'N/A').join(', ')]
      .filter((x) => x && x !== 'N/A')
      .join(', ') || DASH;

  const companyAddress = dash(d.company.address);
  const bookingRef = d.bookingReference ? String(d.bookingReference) : DASH;
  const today = new Date().toISOString();

  return (
    <div className="rounded-xl bg-[#F5F7F9] p-3 sm:p-6 print:bg-white print:p-0">
      <div className="max-w-[820px] mx-auto space-y-5 text-[#131314]">
        <Paper className="pt-10 pb-12">
          {/* The document's own letterhead: name — owner, then contacts. */}
          <div className="pb-6 mb-6 border-b border-[#F2F3F6] text-right text-[10px] leading-none text-[#515151]">
            <p className="font-bold text-[12px] sm:text-[14px] text-[#131314] mb-2 break-words">
              {owner?.name && owner.name !== d.company.name
                ? `${d.company.name} — ${owner.name}`
                : d.company.name}
            </p>
            {dash(d.company.phone) !== DASH || dash(d.company.email) !== DASH ? (
              <p className="break-words">
                {dash(d.company.phone) !== DASH ? d.company.phone : ''}
                {dash(d.company.phone) !== DASH && dash(d.company.email) !== DASH ? (
                  <span className="mx-1.5">•</span>
                ) : null}
                {dash(d.company.email) !== DASH ? d.company.email : ''}
              </p>
            ) : null}
          </div>

          <h1 className="font-manrope font-bold text-[16px] sm:text-[20px] tracking-tight-2 text-[#131314] text-center uppercase">
            <Dyn>Vehicle Rental Agreement</Dyn>
          </h1>

          <p className={`${BODY} mt-6`}>
            This Vehicle Rental Agreement (&ldquo;Agreement&rdquo;) is entered into as of the date
            signed below, by and between <Fill value={dash(d.company.name) !== DASH ? d.company.name : null} w={32} />
            {owner?.name ? (
              <>
                , represented by <Fill value={owner.name} w={24} />
              </>
            ) : null}{' '}
            (&ldquo;<b className="font-bold">Owner</b>&rdquo;), and the Renter named in the Rental
            Summary below.
          </p>
          <p className={`${BODY} mt-3`}>
            Owner and Renter may each be referred to individually as a &ldquo;Party&rdquo; and
            collectively as the &ldquo;Parties.&rdquo;
            {d.company.domain ? (
              <>
                {' '}This Agreement was arranged via <Fill value={d.company.domain} w={22} />.
              </>
            ) : null}{' '}
            The booking reference number is recorded in the Rental Summary below.
          </p>

          <SummaryHeading>Rental Summary</SummaryHeading>
          <p className={`${BODY} mt-2 text-[#5D5D5D]`}>
            <Dyn>
              Complete this page for each booking. The numbered sections that follow are standard
              terms and refer back to the information recorded here.
            </Dyn>
          </p>

          <SummaryHeading>Booking</SummaryHeading>
          <FieldGrid rows={[['Booking Reference #', bookingRef]]} />

          <SummaryHeading>Renter</SummaryHeading>
          <FieldGrid
            rows={[
              ['Full Legal Name', dash(c.name)],
              ['Phone / Email', dash(c.phone)],
              ['Address', renterAddress],
              ["Driver's License Number / State", dash(c.licenseNumber)],
              ['Date of Birth', dash(c.birthDate)],
              ['License Expiry', dash(c.licenseExpiry)],
            ]}
          />
          <p className={`${BODY} mt-3 text-[#5D5D5D]`}>
            <Dyn>(The person named above is the &ldquo;Renter&rdquo; under this Agreement.)</Dyn>
          </p>

          {(d.secondaryDrivers ?? []).length > 0 ? (
            <>
              <SummaryHeading>Additional Authorized Drivers</SummaryHeading>
              {(d.secondaryDrivers ?? []).map((sd, i) => (
                <FieldGrid
                  key={i}
                  rows={[
                    [`Driver ${i + 2} — Full Legal Name`, dash(sd.name)],
                    [`Driver ${i + 2} — License # / State`, dash(sd.licenseNumber)],
                    [`Driver ${i + 2} — Date of Birth`, dash(sd.birthDate)],
                    [`Driver ${i + 2} — Phone`, dash(sd.phone)],
                  ]}
                />
              ))}
            </>
          ) : null}

          <SummaryHeading>Vehicle</SummaryHeading>
          <FieldGrid
            rows={[
              ['Year / Make / Model', dash(v.vehicleName)],
              ['License Plate / State', dash(v.licensePlate)],
              ['VIN', dash(v.vin)],
              ['Color', dash(v.color)],
              ['Odometer Reading at Pickup', dash(v.odometer)],
            ]}
          />

          <SummaryHeading>Rental Period</SummaryHeading>
          <FieldGrid
            rows={[
              ['Pickup Date & Time', dash(v.pickupDateTime)],
              ['Return Date & Time', dash(v.dropoffDateTime)],
            ]}
          />

          <SummaryHeading>Charges &amp; Extras</SummaryHeading>
          <FieldGrid rows={[['Number of Days', dash(v.numberOfDays)]]} />
          {d.extras && d.extras.length > 0 ? (
            <ul className={`${BODY} mt-3 space-y-1`}>
              {d.extras.map((e, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span aria-hidden>☑</span>
                  <span>
                    <Dyn>{e.name}</Dyn>
                    {e.price ? <span className="font-bold"> — {e.price}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <FieldGrid
            rows={[
              ['Total Due at Booking', dash(d.invoice?.total)],
              ['Security Deposit', dash(d.invoice?.deposit)],
            ]}
          />

        </Paper>

        <Paper className="pt-10 pb-12">
          {d.clauses.length === 0 ? (
            <p className={`${BODY} text-slate-400 text-center`}>
              <Dyn>No clauses have been activated yet.</Dyn>
            </p>
          ) : (
            d.clauses.map((clause, index) => (
              <div key={clause.id} className="clause-block">
                <SectionHeading n={index + 1}>{clause.title}</SectionHeading>
                <DynHtml
                  html={clause.content}
                  className={`${BODY} mt-2 prose prose-sm max-w-none`}
                />
              </div>
            ))
          )}

          {d.cardOnFile && d.cardClause ? (
            <div className="clause-block">
              <SectionHeading n={d.clauses.length + 1}>Payment Method on File</SectionHeading>
              <div
                className={`${BODY} mt-2 [&_p]:mt-2! [&_p:first-child]:mt-0!`}
                dangerouslySetInnerHTML={{ __html: d.cardClause.content }}
              />
              <FieldGrid
                rows={
                  d.cardOnFile.isCard
                    ? [
                        ['Cardholder Name', dash(d.cardOnFile.cardholderName)],
                        ['Card Type', dash(d.cardOnFile.brandLabel)],
                        ['Card Number', dash(d.cardOnFile.maskedNumber)],
                        ['Expiration', dash(d.cardOnFile.expiry)],
                      ]
                    : [
                        ['Name on Account', dash(d.cardOnFile.cardholderName)],
                        ['Payment Method', dash(d.cardOnFile.methodLabel)],
                      ]
                }
              />
            </div>
          ) : null}
        </Paper>

        {d.addendum && d.addendum.sections.length > 0 ? (
          <Paper className="pt-10 pb-12">
            <h2 className="font-manrope font-bold text-[12px] sm:text-[14px] text-[#131314] uppercase">
              <Dyn>{d.addendum.title}</Dyn>
            </h2>
            {d.addendum.sections.map((sec, index) => (
              <div key={index} className="clause-block">
                <SectionHeading n={index + 1}>{sec.heading}</SectionHeading>
                <Clause>
                  <Dyn>{sec.body}</Dyn>
                </Clause>
              </div>
            ))}
          </Paper>
        ) : null}

        <Paper className="pt-10 pb-14">
          <h2 className="font-manrope font-bold text-[12px] sm:text-[14px] text-[#131314] uppercase">
            <Dyn>Signatures</Dyn>
          </h2>
          <p className={`${BODY} mt-3`}>
            <Dyn>
              By signing below, both Parties acknowledge they have read, understood, and agree to be
              bound by all terms of this Agreement.
            </Dyn>
          </p>

          <SignatureSlot
            role="Owner Signature"
            image={owner?.signatureImage ?? null}
            name={owner?.name || d.company.name}
            signedAt={owner?.signatureImage ? today : null}
            timezone={d.timezone}
          />

          <SignatureSlot
            role="Renter Signature"
            image={d.signatureImage}
            name={c.name}
            signedAt={d.signedAt}
            timezone={d.timezone}
            onSignatureChange={onSignatureChange}
          />

          <p className="mt-12 text-[10px] sm:text-[11px] italic leading-[1.6] text-[#7D7D7D]">
            <Dyn>
              This is a general-purpose template and does not constitute legal advice.
              Rental, insurance, and consumer-protection requirements vary by state —
              have this document reviewed by a licensed attorney in your state before
              using it with paying customers.
            </Dyn>
          </p>
        </Paper>
      </div>
    </div>
  );
}
