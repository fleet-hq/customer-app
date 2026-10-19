'use client';

import { Dyn } from '@/components/i18n/Dyn';
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
  // 0 means the agreement record doesn't exist yet (previewing before
  // booking) — there is no number to show rather than "AGR-000".
  if (id == null || id === 0) return DASH;
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

/** Section heading for the agreement.
 *
 *  The spacing rides on a wrapper rather than the h2 itself. Template 2's
 *  stylesheet resets `.t2 h1, .t2 h2, .t2 h3 { margin: 0 }`, and because a
 *  CSS module is unlayered while Tailwind's utilities sit in @layer
 *  utilities, that reset beats `mt-10` outright — specificity never comes
 *  into it. A div is not an h2, so it keeps its margin in both templates.
 */
function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-manrope font-bold text-[12px] sm:text-[14px] leading-[85%] tracking-normal text-[#131314] text-center pb-4">
        {children}
      </h2>
    </div>
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
            <td className="border border-[#E0E0E0] px-3 py-2 text-[#5D5D5D]"><Dyn>{label}</Dyn></td>
            <td className="border border-[#E0E0E0] px-3 py-2 font-bold text-[#131314]">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExtrasTable({ rows }: { rows: NonNullable<AgreementData['extras']> }) {
  return (
    <table className="w-full mt-3 border-collapse text-[10px] table-fixed">
      <colgroup>
        <col style={{ width: '46%' }} />
        <col style={{ width: '27%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '15%' }} />
      </colgroup>
      <thead>
        <tr>
          <th className="border border-[#E0E0E0] px-3 py-2 text-left text-[#5D5D5D]"><Dyn>Extra</Dyn></th>
          <th className="border border-[#E0E0E0] px-3 py-2 text-left text-[#5D5D5D]"><Dyn>Price</Dyn></th>
          <th className="border border-[#E0E0E0] px-3 py-2 text-center text-[#5D5D5D]"><Dyn>Qty</Dyn></th>
          <th className="border border-[#E0E0E0] px-3 py-2 text-center text-[#5D5D5D]"><Dyn>Included</Dyn></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((extra, i) => (
          <tr key={i}>
            <td className="border border-[#E0E0E0] px-3 py-2 text-[#131314]"><Dyn>{extra.name}</Dyn></td>
            <td className="border border-[#E0E0E0] px-3 py-2 font-bold text-[#131314]">{extra.price}</td>
            <td className="border border-[#E0E0E0] px-3 py-2 text-center font-bold text-[#131314]">
              {extra.purchased ? extra.quantity : '—'}
            </td>
            <td className="border border-[#E0E0E0] px-3 py-2 text-center font-bold text-[#131314]">
              {extra.purchased ? '✓' : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Fill({ value, w = 24 }: { value?: string | null; w?: number }) {
  return (
    <span
      className="inline-block align-baseline border-b border-black mx-0.5 text-center text-[#131314] leading-none px-1 font-caveat text-[14px] sm:text-[16px]"
      style={{ minWidth: `${w * 4}px` }}
    >
      {value || ' '}
    </span>
  );
}

export interface RentalAgreementPreviewProps {
  data?: AgreementData;
  onSignatureChange?: (signature: string | null) => void;
}

export { DASH, dash, fmtDateLong, agreementNo, Paper, SectionTitle, SpecTable, ExtrasTable, Fill };
export type { SpecRow };
