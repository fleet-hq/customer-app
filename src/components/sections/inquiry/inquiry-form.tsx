'use client';

import { useState } from 'react';
import type { InquiryFormConfig } from '@/services/companyContentServices';
import { submitInquiry } from '@/services/inquiryServices';

const OTHER_RE = /other/i;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-[13px] font-semibold text-ink">
      {children}
      {required ? <span className="text-primary"> *</span> : null}
    </span>
  );
}

const inputClass =
  'w-full rounded-[10px] border border-card-border bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-primary';

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
      <div className="rounded-[16px] border border-card-border bg-subtle p-8 text-center">
        <h2 className="text-[24px] font-extrabold text-ink">
          {config.confirmation_title || 'Thank you!'}
        </h2>
        <div className="mx-auto mt-3 flex max-w-[460px] flex-col gap-2">
          {(config.confirmation_body ?? [
            "We've received your form. Our team will be reaching out to you soon regarding your booking.",
          ]).map((line, i) => (
            <p key={i} className="text-[15px] leading-[1.6] text-muted">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label required>Passenger Name</Label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label required>Contact Number</Label>
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(303) 555-0100"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label required>Email Address</Label>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      {config.vehicle_options?.length ? (
        <div className="flex flex-col gap-1.5">
          <Label>Select Vehicle</Label>
          <select className={inputClass} value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="">Choose a vehicle…</option>
            {config.vehicle_options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label required>Pickup Location</Label>
          {config.pickup_options?.length ? (
            <select className={inputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} required>
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
              className={`${inputClass} mt-1.5`}
              value={pickupOther}
              onChange={(e) => setPickupOther(e.target.value)}
              placeholder="Please specify pickup location"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Drop-off Location</Label>
          {config.dropoff_options?.length ? (
            <select className={inputClass} value={dropoff} onChange={(e) => setDropoff(e.target.value)}>
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
              className={`${inputClass} mt-1.5`}
              value={dropoffOther}
              onChange={(e) => setDropoffOther(e.target.value)}
              placeholder="Please specify drop-off location"
            />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Pickup Date &amp; Time</Label>
          <input
            className={inputClass}
            type="datetime-local"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Drop-off Date &amp; Time</Label>
          <input
            className={inputClass}
            type="datetime-local"
            value={dropoffAt}
            onChange={(e) => setDropoffAt(e.target.value)}
          />
        </div>
      </div>

      {config.heard_about_options?.length ? (
        <div className="flex flex-col gap-1.5">
          <Label>How Did You Hear About Us?</Label>
          <select className={inputClass} value={heardAbout} onChange={(e) => setHeardAbout(e.target.value)}>
            <option value="">Choose…</option>
            {config.heard_about_options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label>Anything else?</Label>
        <textarea
          className={`${inputClass} min-h-[96px] resize-y`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Special requests, questions, etc."
        />
      </div>

      {status === 'error' ? (
        <p className="text-[14px] font-medium text-danger">
          Something went wrong sending your inquiry. Please try again.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? 'Sending…' : config.submit_label || 'Submit Form'}
        </button>
        {config.submit_microcopy ? (
          <p className="text-[13px] leading-[1.55] text-faint">{config.submit_microcopy}</p>
        ) : null}
      </div>
    </form>
  );
}

function extractPromoCode(note: string): string {
  const m = note.match(/\b([A-Z][A-Z0-9]{3,})\b/);
  return m ? m[1] : '';
}
