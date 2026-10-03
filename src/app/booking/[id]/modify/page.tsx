'use client';

import { use } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { PageLoading } from '@/components/ui/page-loading';
import { Field } from '@/components/ui/field';
import { DateTimeField } from '@/components/search/date-time-field';
import { Calendar, Info } from '@/components/ui/icons';
import { todayISO } from '@/lib/time-slots';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { slotsBlockedOn } from '@/lib/unavailable-slots';
import { Dyn } from '@/components/i18n/Dyn';
import { useTripModify } from './use-trip-modify';
import ModifyTripClientT2 from './modify-client-t2';

function Row({ label, value, muted, note }: { label: string; value: string; muted?: boolean; note?: string }) {
  return (
    <>
      <div className="flex items-center justify-between text-[13px]">
        <span className={muted ? 'text-muted' : 'text-secondary'}>{label}</span>
        <span className={muted ? 'text-ink' : 'font-medium text-ink'}>{value}</span>
      </div>
      {note && <p className="mt-[2px] text-[10.5px] leading-[1.45] italic text-faint">{note}</p>}
    </>
  );
}

export default function ModifyTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tm = useTripModify(id);

  if (tm.tenant.websiteTemplate === 'template_2') {
    return <ModifyTripClientT2 id={id} />;
  }

  if (tm.status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <PageLoading />
      </div>
    );
  }

  if (tm.status === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-20 text-center">
          <h1 className="text-2xl font-semibold text-ink"><Dyn>Booking not found</Dyn></h1>
          <p className="mt-2 text-muted"><Dyn>The booking you are looking for does not exist.</Dyn></p>
        </section>
      </div>
    );
  }

  const {
    id: bookingId,
    token,
    router,
    booking,
    t,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    setReturnDate,
    setReturnTime,
    isOngoing,
    handlePickupDate,
    setPickupTime,
    unavailableDates,
    unavailabilityIndex,
    fleet,
    changed,
    preview,
    previewLoading,
    saving,
    error,
    handleConfirm,
    priceDiff,
    modificationFee,
    newTotal,
    currentTotal,
    notAllowed,
    nb,
    newDays,
    unitLabel,
    nbBase,
    nbFleetDiscount,
    nbLocation,
    nbFees,
    nbInsurance,
    nbTax,
    extensionInsurance,
    insuranceRefund,
    insuranceExcluded,
    originalTotal,
    priceNotice,
  } = tm;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[760px] flex-1 px-6 pt-[22px] pb-16">
        <BackLink href={`${paths.booking(bookingId)}?token=${token || ''}`}><Dyn>Back to booking</Dyn></BackLink>

        <h1 className="mt-[14px] text-2xl font-semibold tracking-[-0.01em] text-ink"><Dyn>Modify your trip</Dyn></h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          <Dyn>Update your pick-up and return details. Price changes are shown before you confirm.</Dyn>
        </p>

        <div className="mt-[22px] rounded-2xl border border-card-border bg-white p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-[18px]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] min-[560px]:grid-cols-2">
              <Field label={`${t('Pick-up date & time')}${isOngoing ? ` ${t('(locked — trip has started)')}` : ''}`}>
                <div className={`rounded-[10px] border border-line px-[14px] py-3 ${isOngoing ? 'opacity-75' : ''}`}>
                  <DateTimeField
                    date={pickupDate}
                    time={pickupTime}
                    onDate={isOngoing ? () => {} : handlePickupDate}
                    onTime={isOngoing ? () => {} : setPickupTime}
                    minDate={todayISO()}
                    unavailableDates={unavailableDates}
                    disabledSlots={slotsBlockedOn(unavailabilityIndex, pickupDate, 'pickup')}
                    label="Pick-up"
                  />
                </div>
              </Field>
              <Field label={t('Return date & time')}>
                <div className="rounded-[10px] border border-line px-[14px] py-3">
                  <DateTimeField
                    date={returnDate}
                    time={returnTime}
                    onDate={setReturnDate}
                    onTime={setReturnTime}
                    minDate={pickupDate || todayISO()}
                    highlightDate={pickupDate}
                    unavailableDates={unavailableDates}
                    disabledSlots={slotsBlockedOn(unavailabilityIndex, returnDate, 'dropoff')}
                    label="Return"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-[10px] rounded-[10px] border border-primary-border bg-primary-soft px-[14px] py-[12px]">
            <Info size={15} strokeWidth={2} className="mt-px flex-shrink-0 text-primary" />
            <span className="text-[11.5px] leading-[1.5] text-secondary">
              <Dyn>Any price difference is settled when you confirm. Dates already booked are not available.</Dyn>
            </span>
          </div>
        </div>

        {priceNotice && (
          <div
            className={`mt-[14px] flex items-start gap-[10px] rounded-[10px] border px-[14px] py-[10px] ${
              priceNotice.tone === 'negative'
                ? 'border-danger-border bg-danger-bg'
                : 'border-green-border-2 bg-green-bg'
            }`}
          >
            <Info
              size={15}
              strokeWidth={2}
              className={`mt-px flex-shrink-0 ${priceNotice.tone === 'negative' ? 'text-danger-text' : 'text-success'}`}
            />
            <span
              className={`text-[11.5px] leading-[1.5] ${priceNotice.tone === 'negative' ? 'text-danger-text' : 'text-success'}`}
            >
              <Dyn>{priceNotice.message}</Dyn>
            </span>
          </div>
        )}

        {(fleet?.isPeakPricing || fleet?.isPromoPricing) && changed && (
          <div className="mt-[14px] space-y-2">
            {fleet?.isPeakPricing && (
              <p className="rounded-[10px] border border-amber-border bg-amber-bg px-[14px] py-[10px] text-[11.5px] leading-[1.5] text-amber-text">
                <Dyn>Peak-day pricing is in effect for the selected dates.</Dyn>
              </p>
            )}
            {fleet?.isPromoPricing && (
              <p className="rounded-[10px] border border-green-border-2 bg-green-bg px-[14px] py-[10px] text-[11.5px] leading-[1.5] text-success">
                <Dyn>Promo pricing is in effect for the selected dates.</Dyn>
              </p>
            )}
          </div>
        )}

        <div className="mt-[22px] rounded-2xl border border-card-border bg-subtle p-6">
          <div className="mb-[14px] flex items-center gap-2 text-sm font-semibold text-ink">
            <Calendar size={16} className="text-primary" /> <Dyn>Price difference</Dyn>
          </div>

          {changed && nb ? (
            <div className="space-y-[10px]">
              {priceDiff >= 0 && nbFees === 0 ? (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint"><Dyn>Extension charges</Dyn></p>
                  <Row
                    label={`${t('Additional rental')}${newDays != null ? ` (${newDays} ${unitLabel}${newDays === 1 ? '' : 's'})` : ''}`}
                    value={money(nbBase)}
                  />
                  {nbTax > 0 && <Row label={t('Tax')} value={money(nbTax)} />}
                  {(extensionInsurance || nbInsurance) > 0 && (
                    <Row label={t('Insurance (additional days)')} value={money(extensionInsurance || nbInsurance)} />
                  )}
                </>
              ) : (
                <>
                  <Row label={t('Rental total')} value={money(nbBase)} />
                  {nbFleetDiscount > 0 && <Row label={t('Fleet discount')} value={`-${money(nbFleetDiscount)}`} />}
                  {nbLocation > 0 && <Row label={t('Location charges')} value={money(nbLocation)} />}
                  {nbFees > 0 && <Row label={t('Booking fees')} value={money(nbFees)} />}
                  {nbInsurance > 0 && (
                    <Row
                      label={t('Insurance')}
                      value={money(nbInsurance)}
                      note={extensionInsurance > 0 ? t('Premium is recalculated by your insurance provider for the new dates; you pay the difference between the original and the new premium.') : undefined}
                    />
                  )}
                  {nbTax > 0 && <Row label={t('Tax')} value={money(nbTax)} />}
                </>
              )}

              {priceDiff < 0 && (
                <>
                  {insuranceRefund > 0 && (
                    <Row
                      label={t('Insurance (refundable)')}
                      value={`+${money(insuranceRefund)}`}
                      note={t("Premium is recalculated by your insurance provider for the new shorter dates; you're refunded the difference.")}
                    />
                  )}
                  {insuranceExcluded > 0 && <Row label={t('Insurance (non-refundable)')} value={`-${money(insuranceExcluded)}`} />}
                </>
              )}
              {modificationFee > 0 && <Row label={t('Modification fee')} value={`-${money(modificationFee)}`} />}

              <div className="my-1 h-px bg-card-border" />
              <Row label={t('Previous total')} value={money(originalTotal)} muted />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink"><Dyn>New total</Dyn></span>
                <span className="text-[17px] font-bold text-ink">{money(newTotal!)}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted"><Dyn>Current total</Dyn></span>
                <span className="font-medium text-ink">{money(currentTotal)}</span>
              </div>
              <div className="mt-[10px] flex items-center justify-between text-[13px]">
                <div>
                  <span className="text-muted"><Dyn>New total</Dyn></span>
                  {newTotal !== null && (
                    <span className="ml-2 text-[11.5px] text-faint">
                      {money(newTotal)}
                      {newDays != null ? ` · ${newDays} ${unitLabel}${newDays === 1 ? '' : 's'}` : ''}
                      {modificationFee > 0 ? ` · incl. ${money(modificationFee)} fee` : ''}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-secondary">{newTotal !== null ? money(newTotal) : '—'}</span>
              </div>
            </>
          )}

          <div className="my-4 h-px bg-card-border" />

          {previewLoading ? (
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              <Dyn>Calculating...</Dyn>
            </div>
          ) : notAllowed ? (
            <div className="flex items-center gap-2 text-[12.5px] text-red-600">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              {t(preview.reason || 'These dates are not available for this change.')}
            </div>
          ) : !changed ? (
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              <Dyn>No price change yet — adjust your dates to see the difference.</Dyn>
            </div>
          ) : priceDiff > 0 ? (
            <div className="flex items-center justify-between rounded-[10px] border border-amber-border bg-amber-bg px-4 py-[13px]">
              <span className="text-[13px] font-semibold text-amber-text"><Dyn>Additional payment due</Dyn></span>
              <span className="text-[15px] font-bold text-amber-text-2">{money(priceDiff)}</span>
            </div>
          ) : priceDiff < 0 ? (
            <div className="flex items-center justify-between rounded-[10px] border border-green-border-2 bg-green-bg px-4 py-[13px]">
              <span className="text-[13px] font-semibold text-success"><Dyn>Refund due</Dyn></span>
              <span className="text-[15px] font-bold text-success">{money(Math.abs(priceDiff))}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <Info size={14} strokeWidth={2} className="flex-shrink-0" />
              <Dyn>No additional charge for this change.</Dyn>
            </div>
          )}
        </div>

        {error && <p className="mt-[14px] text-[13px] text-red-600">{t(error)}</p>}

        <div className="mt-[22px] flex items-center gap-3">
          <button
            onClick={() => router.push(`${paths.booking(bookingId)}?token=${token || ''}`)}
            className="flex-shrink-0 rounded-[10px] border border-line bg-white px-[26px] py-[13px] text-sm font-semibold text-ink"
          >
            <Dyn>Cancel</Dyn>
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || previewLoading || notAllowed}
            className="flex-1 rounded-[10px] bg-primary py-[13px] text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? t('Processing...')
              : priceDiff < 0
                ? t('Confirm refund')
                : priceDiff > 0
                  ? t('Review & pay')
                  : t('Confirm changes')}
          </button>
        </div>
      </section>
    </div>
  );
}
