'use client';

import { useState } from 'react';
import type { InquiryFormConfig } from '@/services/companyContentServices';
import { submitInquiry } from '@/services/inquiryServices';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { DateTimeField } from '@/components/search/date-time-field';
import { ArrowRight } from '@/components/ui/icons';

// TESTING: the inquiry email is NOT sent while this is true, so the UI can be
// tried end-to-end without notifying the tenant. Flip to false to reconnect.
const FORM_DISCONNECTED = false;

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

const baseField =
  'w-full rounded-[10px] border border-card-border bg-white px-[13px] text-[14px] text-ink outline-none transition-all placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]';
const inputClass = `${baseField} h-[40px]`;
const textareaClass = `${baseField} min-h-[84px] py-[10px] resize-y`;

export function InquiryForm({
  config,
  tenantName,
  domain,
}: {
  config: InquiryFormConfig;
  tenantName: string;
  domain: string;
}) {
  // Tenants hide the fields they do not need; nothing hidden keeps the
  // full form, so sites configured before this are unaffected.
  const hiddenFields = new Set<string>(config.hidden_fields ?? []);
  const shows = (key: string) => !hiddenFields.has(key);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [pickup, setPickup] = useState('');
  const [pickupOther, setPickupOther] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [dropoffOther, setDropoffOther] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [heardAbout, setHeardAbout] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [showPromo, setShowPromo] = useState(false);

  const pickupIsOther = OTHER_RE.test(pickup);
  const dropoffIsOther = OTHER_RE.test(dropoff);
  const promoCode = config.promo_note ? extractPromoCode(config.promo_note) : '';

  const combineIso = (date: string, time: string): string | null => {
    if (!date) return null;
    const d = new Date(`${date}T${time || '00:00'}`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (FORM_DISCONNECTED) {
      setShowPromo(true);
      return;
    }

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
          pickup_at: combineIso(pickupDate, pickupTime),
          dropoff_at: combineIso(dropoffDate, dropoffTime),
          heard_about: heardAbout,
          promo_code: promoCode,
          message: message.trim(),
        },
        domain,
      );
      setStatus('idle');
      setShowPromo(true);
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-[16px]">
        <Field label="Passenger Name" required>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First and last name"
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
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
            <Select
              value={vehicle}
              onChange={setVehicle}
              options={config.vehicle_options}
              placeholder="Choose a vehicle…"
              ariaLabel="Select Vehicle"
            />
          </Field>
        ) : null}

        {shows('pickup_location') || shows('dropoff_location') ? (
        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
          {shows('pickup_location') ? (
          <Field label="Pickup Location" required>
            {config.pickup_options?.length ? (
              <Select
                value={pickup}
                onChange={setPickup}
                options={config.pickup_options}
                placeholder="Choose…"
                ariaLabel="Pickup Location"
              />
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
          ) : null}
          {shows('dropoff_location') ? (
          <Field label="Drop-off Location">
            {config.dropoff_options?.length ? (
              <Select
                value={dropoff}
                onChange={setDropoff}
                options={config.dropoff_options}
                placeholder="Choose…"
                ariaLabel="Drop-off Location"
              />
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
          ) : null}
        </div>
        ) : null}

        {shows('pickup_datetime') || shows('dropoff_datetime') ? (
        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
          {shows('pickup_datetime') ? (
          <Field label="Pickup Date & Time">
            <div className={`${baseField} flex h-[40px] items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]`}>
              <DateTimeField
                date={pickupDate}
                time={pickupTime}
                onDate={setPickupDate}
                onTime={setPickupTime}
                compact
                label="Pickup"
              />
            </div>
          </Field>
          ) : null}
          {shows('dropoff_datetime') ? (
          <Field label="Drop-off Date & Time">
            <div className={`${baseField} flex h-[40px] items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]`}>
              <DateTimeField
                date={dropoffDate}
                time={dropoffTime}
                onDate={setDropoffDate}
                onTime={setDropoffTime}
                compact
                label="Drop-off"
              />
            </div>
          </Field>
          ) : null}
        </div>
        ) : null}

        {config.heard_about_options?.length ? (
          <Field label="How Did You Hear About Us?">
            <Select
              value={heardAbout}
              onChange={setHeardAbout}
              options={config.heard_about_options}
              placeholder="Choose…"
              ariaLabel="How did you hear about us?"
            />
          </Field>
        ) : null}

        {shows('message') ? (
        <Field label="Anything else?">
          <textarea
            className={textareaClass}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Special requests, questions, etc."
          />
        </Field>
        ) : null}

        {status === 'error' ? (
          <p className="rounded-[10px] border border-danger-border bg-danger-bg px-[14px] py-[10px] text-[14px] font-medium text-danger-text">
            Something went wrong sending your inquiry. Please try again, or contact us directly.
          </p>
        ) : null}

        <div className="mt-[4px] flex flex-col gap-[10px]">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="inline-flex items-center justify-center gap-[9px] rounded-full bg-primary px-[30px] py-[13px] text-[15px] font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'submitting' ? 'Sending…' : config.submit_label || 'Submit Form'}
            {status === 'submitting' ? null : <ArrowRight size={17} />}
          </button>
          {config.submit_microcopy ? (
            <p className="text-center text-[13px] leading-[1.55] text-faint">{config.submit_microcopy}</p>
          ) : null}
        </div>
      </form>

      <Dialog isOpen={showPromo} onClose={() => setShowPromo(false)} panelClassName="max-w-[400px]">
        <div className="px-[30px] py-[32px] text-center">
          <h2 className="font-manrope text-[23px] font-bold tracking-[-0.01em] text-ink">
            {config.confirmation_title || "Thanks — you're all set"}
          </h2>
          <p className="mx-auto mt-[9px] max-w-[300px] text-[14.5px] leading-[1.6] text-muted">
            We&apos;ll be in touch shortly. Here&apos;s a little something for booking directly with {tenantName}.
          </p>

          {promoCode ? (
            <div className="mx-auto mt-[22px] flex w-fit items-center rounded-[12px] border border-dashed border-primary bg-primary-soft px-[24px] py-[14px]">
              <span className="font-manrope text-[22px] font-bold tracking-[0.1em] text-primary">
                {promoCode}
              </span>
            </div>
          ) : null}

          {config.promo_note ? (
            <p className="mx-auto mt-[14px] max-w-[300px] text-[14px] leading-[1.55] text-label">
              {config.promo_note}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setShowPromo(false)}
            className="mt-[26px] inline-flex w-full items-center justify-center rounded-full bg-primary px-[28px] py-[13px] text-[14.5px] font-semibold text-white transition-all hover:bg-primary-hover"
          >
            Got it
          </button>
        </div>
      </Dialog>
    </>
  );
}

function extractPromoCode(note: string): string {
  const m = note.match(/\b([A-Z][A-Z0-9]{3,})\b/);
  return m ? m[1] : '';
}
