'use client';

import { useState } from 'react';
import type { InquiryFormConfig } from '@/services/companyContentServices';
import { submitInquiry } from '@/services/inquiryServices';
import { Check, ArrowRight } from '@/components/ui/icons';

const OTHER_RE = /other/i;

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[7px]">
      <span className="text-[13px] font-semibold text-label">
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-[12px] border border-card-border bg-white px-[14px] py-[12px] text-[15px] text-ink outline-none transition-all placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]';

const selectClass = inputClass + ' appearance-none bg-[length:16px] pr-[38px]';
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23637083' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

export function InquiryForm({
  config,
  tenantName,
  domain,
}: {
  config: InquiryFormConfig;
  tenantName: string;
  domain: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [pickup, setPickup] = useState('');
  const [pickupOther, setPickupOther] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [dropoffOther, setDropoffOther] = useState('');
  const [pickupAt, setPickupAt] = useState('');
  const [dropoffAt, setDropoffAt] = useState('');
  const [heardAbout, setHeardAbout] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const pickupIsOther = OTHER_RE.test(pickup);
  const dropoffIsOther = OTHER_RE.test(dropoff);

  const selectStyle = { backgroundImage: CHEVRON, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' } as React.CSSProperties;

  const toIso = (local: string): string | null => {
    if (!local) return null;
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('submitting');
    try {
      await submitInquiry(
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          vehicle,
          pickup_location: pickupIsOther ? pickupOther.trim() || pickup : pickup,
          dropoff_location: dropoffIsOther ? dropoffOther.trim() || dropoff : dropoff,
          pickup_at: toIso(pickupAt),
          dropoff_at: toIso(dropoffAt),
          heard_about: heardAbout,
          promo_code: config.promo_note ? extractPromoCode(config.promo_note) : '',
          message: message.trim(),
        },
        domain,
      );
      setStatus('done');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-[16px] py-[24px] text-center">
        <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-primary-soft text-primary">
          <Check size={30} />
        </span>
        <h2 className="font-manrope text-[26px] font-bold text-ink">
          {config.confirmation_title || 'Thank you!'}
        </h2>
        <div className="flex max-w-[440px] flex-col gap-[8px]">
          {(config.confirmation_body ?? [
            "We've received your form. Our team will be reaching out to you soon regarding your booking.",
          ]).map((line, i) => (
            <p key={i} className="text-[15px] leading-[1.65] text-muted">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[18px]">
      <Field label="Passenger Name" required>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <Field label="Contact Number" required>
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(303) 555-0100"
            required
          />
        </Field>
        <Field label="Email Address" required>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>
      </div>

      {config.vehicle_options?.length ? (
        <Field label="Select Vehicle">
          <select className={selectClass} style={selectStyle} value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="">Choose a vehicle…</option>
            {config.vehicle_options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <Field label="Pickup Location" required>
          {config.pickup_options?.length ? (
            <select className={selectClass} style={selectStyle} value={pickup} onChange={(e) => setPickup(e.target.value)} required>
              <option value="">Choose…</option>
              {config.pickup_options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input className={inputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} required />
          )}
          {pickupIsOther ? (
            <input
              className={inputClass}
              value={pickupOther}
              onChange={(e) => setPickupOther(e.target.value)}
              placeholder="Please specify pickup location"
            />
          ) : null}
        </Field>
        <Field label="Drop-off Location">
          {config.dropoff_options?.length ? (
            <select className={selectClass} style={selectStyle} value={dropoff} onChange={(e) => setDropoff(e.target.value)}>
              <option value="">Choose…</option>
              {config.dropoff_options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input className={inputClass} value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
          )}
          {dropoffIsOther ? (
            <input
              className={inputClass}
              value={dropoffOther}
              onChange={(e) => setDropoffOther(e.target.value)}
              placeholder="Please specify drop-off location"
            />
          ) : null}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <Field label="Pickup Date & Time">
          <input
            className={inputClass}
            type="datetime-local"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
          />
        </Field>
        <Field label="Drop-off Date & Time">
          <input
            className={inputClass}
            type="datetime-local"
            value={dropoffAt}
            onChange={(e) => setDropoffAt(e.target.value)}
          />
        </Field>
      </div>

      {config.heard_about_options?.length ? (
        <Field label="How Did You Hear About Us?">
          <select className={selectClass} style={selectStyle} value={heardAbout} onChange={(e) => setHeardAbout(e.target.value)}>
            <option value="">Choose…</option>
            {config.heard_about_options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field label="Anything else?">
        <textarea
          className={`${inputClass} min-h-[104px] resize-y`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Special requests, questions, etc."
        />
      </Field>

      {status === 'error' ? (
        <p className="rounded-[10px] border border-danger-border bg-danger-bg px-[14px] py-[10px] text-[14px] font-medium text-danger-text">
          Something went wrong sending your inquiry. Please try again, or contact us directly.
        </p>
      ) : null}

      <div className="mt-[4px] flex flex-col gap-[10px]">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex items-center justify-center gap-[9px] rounded-full bg-primary px-[30px] py-[15px] text-[15px] font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? 'Sending…' : config.submit_label || 'Submit Form'}
          {status === 'submitting' ? null : <ArrowRight size={17} />}
        </button>
        {config.submit_microcopy ? (
          <p className="text-center text-[13px] leading-[1.55] text-faint">{config.submit_microcopy}</p>
        ) : null}
      </div>
    </form>
  );
}

function extractPromoCode(note: string): string {
  const m = note.match(/\b([A-Z][A-Z0-9]{3,})\b/);
  return m ? m[1] : '';
}
