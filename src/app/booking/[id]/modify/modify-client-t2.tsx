'use client';

import type { ReactNode } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { Field } from '@/components/ui/field';
import { DateTimeField } from '@/components/search/date-time-field';
import { todayISO } from '@/lib/time-slots';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { slotsBlockedOn } from '@/lib/unavailable-slots';
import { Dyn } from '@/components/i18n/Dyn';
import { useTripModify } from './use-trip-modify';
import styles from '@/styles/template-2.module.css';

function T2Row({ label, value, muted, note }: { label: ReactNode; value: string; muted?: boolean; note?: string }) {
  return (
    <div className={styles.priceLine}>
      <div style={{ flex: 1 }}>
        <span style={{ color: muted ? 'var(--text-muted)' : 'var(--text)' }}>{label}</span>
        {note && <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{note}</div>}
      </div>
      <span style={{ fontWeight: muted ? 400 : 600 }}>{value}</span>
    </div>
  );
}

export default function ModifyTripClientT2({ id }: { id: string }) {
  const tm = useTripModify(id);

  if (tm.status === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}><Dyn>Loading…</Dyn></p>
      </div>
    );
  }

  if (tm.status === 'not-found') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.6rem' }}>
        <h1><Dyn>Booking not found</Dyn></h1>
        <p style={{ color: 'var(--text-muted)' }}><Dyn>The booking you are looking for does not exist.</Dyn></p>
      </div>
    );
  }

  const {
    id: bookingId,
    token,
    router,
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
    <div className={styles.section}>
      <div className={styles.container} style={{ maxWidth: '46rem' }}>
        <BackLink href={`${paths.booking(bookingId)}?token=${token || ''}`}><Dyn>Back to booking</Dyn></BackLink>

        <h1 style={{ marginTop: '1rem' }}><Dyn>Modify your trip</Dyn></h1>
        <p style={{ marginTop: '0.6rem', color: 'var(--text-muted)' }}>
          <Dyn>Update your pick-up and return details. Price changes are shown before you confirm.</Dyn>
        </p>

        <div className={styles.priceCard} style={{ marginTop: '1.6rem', position: 'static' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label={`${t('Pick-up date & time')}${isOngoing ? ` ${t('(locked — trip has started)')}` : ''}`}>
              <div style={{ borderRadius: 2, border: '1px solid var(--line)', padding: '0.7rem 0.85rem', opacity: isOngoing ? 0.75 : 1 }}>
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
              <div style={{ borderRadius: 2, border: '1px solid var(--line)', padding: '0.7rem 0.85rem' }}>
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

          <div className={styles.noticeBox}>
            <span><Dyn>Any price difference is settled when you confirm. Dates already booked are not available.</Dyn></span>
          </div>
        </div>

        {priceNotice && (
          <p
            className={`${styles.noticeBox} ${priceNotice.tone === 'negative' ? styles.noticeBoxDanger : styles.noticeBoxSuccess}`}
          >
            <Dyn>{priceNotice.message}</Dyn>
          </p>
        )}

        {(fleet?.isPeakPricing || fleet?.isPromoPricing) && changed && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fleet?.isPeakPricing && (
              <p className={styles.noticeBox} style={{ marginTop: 0 }}>
                <Dyn>Peak-day pricing is in effect for the selected dates.</Dyn>
              </p>
            )}
            {fleet?.isPromoPricing && (
              <p className={styles.noticeBox} style={{ marginTop: 0, color: 'var(--brass)', borderColor: 'var(--brass)' }}>
                <Dyn>Promo pricing is in effect for the selected dates.</Dyn>
              </p>
            )}
          </div>
        )}

        <div className={styles.priceCard} style={{ marginTop: '1.6rem', position: 'static' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '1rem' }}><Dyn>Price difference</Dyn></h3>

          {changed && nb ? (
            <div>
              {priceDiff >= 0 && nbFees === 0 ? (
                <>
                  <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}><Dyn>Extension charges</Dyn></p>
                  <T2Row
                    label={`${t('Additional rental')}${newDays != null ? ` (${newDays} ${unitLabel}${newDays === 1 ? '' : 's'})` : ''}`}
                    value={money(nbBase)}
                  />
                  {nbTax > 0 && <T2Row label={t('Tax')} value={money(nbTax)} />}
                  {(extensionInsurance || nbInsurance) > 0 && (
                    <T2Row label={t('Insurance (additional days)')} value={money(extensionInsurance || nbInsurance)} />
                  )}
                </>
              ) : (
                <>
                  <T2Row label={t('Rental total')} value={money(nbBase)} />
                  {nbFleetDiscount > 0 && <T2Row label={t('Fleet discount')} value={`-${money(nbFleetDiscount)}`} />}
                  {nbLocation > 0 && <T2Row label={t('Location charges')} value={money(nbLocation)} />}
                  {nbFees > 0 && <T2Row label={t('Booking fees')} value={money(nbFees)} />}
                  {nbInsurance > 0 && (
                    <T2Row
                      label={t('Insurance')}
                      value={money(nbInsurance)}
                      note={extensionInsurance > 0 ? t('Premium is recalculated by your insurance provider for the new dates; you pay the difference between the original and the new premium.') : undefined}
                    />
                  )}
                  {nbTax > 0 && <T2Row label={t('Tax')} value={money(nbTax)} />}
                </>
              )}

              {priceDiff < 0 && (
                <>
                  {insuranceRefund > 0 && (
                    <T2Row
                      label={t('Insurance (refundable)')}
                      value={`+${money(insuranceRefund)}`}
                      note={t("Premium is recalculated by your insurance provider for the new shorter dates; you're refunded the difference.")}
                    />
                  )}
                  {insuranceExcluded > 0 && <T2Row label={t('Insurance (non-refundable)')} value={`-${money(insuranceExcluded)}`} />}
                </>
              )}
              {modificationFee > 0 && <T2Row label={t('Modification fee')} value={`-${money(modificationFee)}`} />}

              <div className={styles.priceDivider} />
              <T2Row label={t('Previous total')} value={money(originalTotal)} muted />
              <div className={styles.totalRow}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}><Dyn>New total</Dyn></span>
                <b>{money(newTotal!)}</b>
              </div>
            </div>
          ) : (
            <>
              <T2Row label={<Dyn>Current total</Dyn>} value={money(currentTotal)} muted />
              <div className={styles.priceLine}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}><Dyn>New total</Dyn></span>
                  {newTotal !== null && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {money(newTotal)}
                      {newDays != null ? ` · ${newDays} ${unitLabel}${newDays === 1 ? '' : 's'}` : ''}
                      {modificationFee > 0 ? ` · incl. ${money(modificationFee)} fee` : ''}
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 600 }}>{newTotal !== null ? money(newTotal) : '—'}</span>
              </div>
            </>
          )}

          <div className={styles.priceDivider} />

          {previewLoading ? (
            <div className={styles.priceEmpty}><Dyn>Calculating...</Dyn></div>
          ) : notAllowed ? (
            <div className={styles.noticeBoxDanger}>{t(preview.reason || 'These dates are not available for this change.')}</div>
          ) : !changed ? (
            <div className={styles.priceEmpty}><Dyn>No price change yet — adjust your dates to see the difference.</Dyn></div>
          ) : priceDiff > 0 ? (
            <div className={styles.totalRow}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--brass)' }}><Dyn>Additional payment due</Dyn></span>
              <b style={{ color: 'var(--brass)' }}>{money(priceDiff)}</b>
            </div>
          ) : priceDiff < 0 ? (
            <div className={styles.totalRow}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}><Dyn>Refund due</Dyn></span>
              <b>{money(Math.abs(priceDiff))}</b>
            </div>
          ) : (
            <div className={styles.priceEmpty}><Dyn>No additional charge for this change.</Dyn></div>
          )}
        </div>

        {error && <p style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.85rem' }}>{t(error)}</p>}

        <div style={{ marginTop: '1.6rem', display: 'flex', gap: '0.8rem' }}>
          <button
            type="button"
            onClick={() => router.push(`${paths.booking(bookingId)}?token=${token || ''}`)}
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            <Dyn>Cancel</Dyn>
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || previewLoading || notAllowed}
            className={`${styles.btn} ${styles.btnBrass} ${styles.reserveBtn}`}
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
      </div>
    </div>
  );
}
