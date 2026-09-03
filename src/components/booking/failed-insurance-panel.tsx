import { cn } from '@/lib/utils';
import type { InsuranceVerificationDetails } from '@/services/bookingServices';

const FAILED_PANEL_CLASSES = 'border-[#FECDCA] bg-[#FEF3F2]';
const FAILED_TEXT_PRIMARY = 'text-[#B42318]';
const FAILED_TEXT_SECONDARY = 'text-[#912018]';
const FAILED_TEXT_MUTED = 'text-[#B42318]/70';

function humanize(s: string): string {
  if (!s) return '';
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatExpiryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FailedInsurancePanel({ details }: { details: InsuranceVerificationDetails }) {
  const rows: { label: string; value: string }[] = [];
  if (details.carrier) rows.push({ label: 'Carrier', value: details.carrier });
  if (details.policyNumber) rows.push({ label: 'Policy #', value: details.policyNumber });
  if (details.policyStatus) rows.push({ label: 'Policy status', value: humanize(details.policyStatus) });
  if (details.policyExpiryDate) rows.push({ label: 'Expiry', value: formatExpiryDate(details.policyExpiryDate) });
  return (
    <div className={cn('mt-3 rounded-lg border p-3', FAILED_PANEL_CLASSES)}>
      <p className={cn('text-[12px] font-semibold', FAILED_TEXT_PRIMARY)}>
        Insurance couldn&apos;t be verified{details.disposition ? ` — ${humanize(details.disposition)}` : ''}
      </p>
      {rows.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className={cn('text-[10.5px] font-medium', FAILED_TEXT_MUTED)}>{r.label}</dt>
              <dd className={cn('text-[10.5px]', FAILED_TEXT_SECONDARY)}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {details.remediationMessages.length > 0 && (
        <ul className={cn('mt-2 list-disc space-y-0.5 pl-4 text-[11px]', FAILED_TEXT_SECONDARY)}>
          {details.remediationMessages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      <p className={cn('mt-2 text-[10.5px] italic', FAILED_TEXT_MUTED)}>
        Contact the operator to update your coverage.
      </p>
    </div>
  );
}
