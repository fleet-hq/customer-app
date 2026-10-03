'use client';

import { BackLink } from '@/components/ui/back-link';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { useVehicleSwap } from './use-vehicle-swap';
import styles from '@/styles/template-2.module.css';
import Image from 'next/image';

export default function SwapVehicleClientT2({ id }: { id: string }) {
  const vs = useVehicleSwap(id);

  const {
    booking,
    bookingError,
    vehicles,
    page,
    setPage,
    loading,
    selected,
    setSelected,
    preview,
    previewLoading,
    error,
    confirming,
    t,
    totalPages,
    selectedVehicle,
    newFleet,
    swapFee,
    refundAmount,
    additionalCharge,
    depositTopup,
    totalDueNow,
    newTotal,
    allowed,
    nb,
    nbBase,
    nbFees,
    nbLocation,
    nbTax,
    nbInsurance,
    insuranceRefund,
    currentTotal,
    unitLabel,
    newVehiclePrice,
    newVehicleName,
    newVehicleImage,
    handleConfirm,
    cancelHref,
    router,
  } = vs;

  if (bookingError) {
    return (
      <div className={styles.section}>
        <div className={styles.container} style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600 }}><Dyn>Booking not found.</Dyn></p>
          <BackLink href={paths.booking(id)}><Dyn>Back to booking</Dyn></BackLink>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section} style={{ paddingBottom: '7rem' }}>
      <div className={styles.container} style={{ maxWidth: '56rem' }}>
        <BackLink href={cancelHref}><Dyn>Back to booking</Dyn></BackLink>

        <h1 style={{ marginTop: '1rem' }}><Dyn>Change your vehicle</Dyn></h1>
        <p style={{ marginTop: '0.6rem', color: 'var(--text-muted)' }}>
          <Dyn>Pick a different vehicle for the same dates. Any price difference is shown before you confirm.</Dyn>
        </p>

        {booking && (
          <div className={styles.priceCard} style={{ marginTop: '1.6rem', position: 'static', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{ width: 100, height: 70, flex: 'none', borderRadius: 2, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url('${booking.vehicle.image}')` }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brass)' }}><Dyn>Current vehicle</Dyn></div>
              <div style={{ margin: '0.2rem 0', fontSize: '1.05rem', fontWeight: 600 }}>{booking.vehicle.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {booking.vehicle.licensePlate}
                {booking.invoice.items[0]?.pricePerDay
                  ? ` · ${money(booking.invoice.items[0].pricePerDay)}/${booking.invoice.items[0].unit || 'day'}`
                  : ''}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '0.98rem', fontWeight: 600 }}><Dyn>Available vehicles</Dyn></div>
        {loading ? (
          <p style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}><Dyn>Loading vehicles...</Dyn></p>
        ) : vehicles.length === 0 ? (
          <div className={styles.emptyState}>
            <p style={{ fontWeight: 600 }}><Dyn>No other vehicles available for swap right now.</Dyn></p>
            <p style={{ marginTop: '0.3rem', color: 'var(--text-muted)' }}>
              <Dyn>Please check back later or contact support if you need a specific change.</Dyn>
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.1rem' }}>
            {vehicles.map((v) => {
              const vid = String(v.id);
              const isSelected = selected === vid;
              const image = v.image || '/images/vehicles/car_placeholder.svg';
              const unitPrice = v.pricePerDay || v.pricePerHour || 0;
              return (
                <button
                  key={vid}
                  type="button"
                  onClick={() => setSelected(vid)}
                  className={styles.carCard}
                  style={{ borderColor: isSelected ? 'var(--brass)' : undefined, textAlign: 'left', cursor: 'pointer' }}
                >
                  <div className={styles.carMedia} style={{ position: 'relative' }}>
                    <Image src={image} alt={v.name} width={780} height={523} unoptimized />
                    {v.vehicleType && <span className={styles.carTag}>{v.vehicleType}</span>}
                    {isSelected && (
                      <span style={{ position: 'absolute', right: '0.7rem', top: '0.7rem', width: 24, height: 24, borderRadius: '50%', background: 'var(--brass)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-brass)', fontSize: '0.8rem', fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                  <div className={styles.carBody}>
                    <h3>{v.name}</h3>
                    <div className={styles.carSpec}>
                      {v.year ? `${v.year}` : ''}
                      {v.seats ? `${v.year ? ' · ' : ''}${v.seats} ${t('seats')}` : ''}
                    </div>
                    <div className={styles.carFoot}>
                      <span className={styles.carPrice}>
                        <b>{money(unitPrice)}</b>
                        <span>/{v.pricePerDay ? 'day' : 'hour'}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className={styles.pagination} style={{ marginTop: '1.8rem', justifyContent: 'center' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.pageBtn} ${page === i + 1 ? styles.pageBtnActive : ''}`}
                onClick={() => {
                  setPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {selectedVehicle && (
          <div className={styles.priceCard} style={{ marginTop: '2rem', position: 'static' }}>
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}><Dyn>Review your change</Dyn></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: 84, height: 58, flex: 'none', borderRadius: 2, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url('${booking?.vehicle.image}')` }} />
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}><Dyn>Current</Dyn></div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{booking?.vehicle.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{money(currentTotal)}</div>
                </div>
              </div>

              <span style={{ color: 'var(--brass)', fontWeight: 700 }}>→</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: 84, height: 58, flex: 'none', borderRadius: 2, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url('${newVehicleImage}')` }} />
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brass)' }}><Dyn>New</Dyn></div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{newVehicleName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {newVehiclePrice ? `${money(newVehiclePrice)}/${newFleet?.pricePerDay || selectedVehicle?.pricePerDay ? 'day' : 'hour'}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {previewLoading ? (
              <p style={{ marginTop: '1.2rem', color: 'var(--text-muted)' }}><Dyn>Calculating new price...</Dyn></p>
            ) : preview && !allowed ? (
              <p style={{ marginTop: '1.2rem', color: 'var(--danger)', fontWeight: 600 }}>{t(preview.reason || 'This swap is not allowed.')}</p>
            ) : preview && allowed ? (
              <div style={{ marginTop: '1.2rem' }}>
                {nb && (
                  <>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}><Dyn>New vehicle breakdown</Dyn></div>
                    <div className={styles.priceLine}>
                      <span><Dyn>Base price</Dyn></span>
                      <span style={{ fontWeight: 600 }}>{money(nbBase)}</span>
                    </div>
                    {nbLocation > 0 && (
                      <div className={styles.priceLine}>
                        <span><Dyn>Location charges</Dyn></span>
                        <span style={{ fontWeight: 600 }}>{money(nbLocation)}</span>
                      </div>
                    )}
                    {nbFees > 0 && (
                      <div className={styles.priceLine}>
                        <span><Dyn>Fees</Dyn></span>
                        <span style={{ fontWeight: 600 }}>{money(nbFees)}</span>
                      </div>
                    )}
                    {nbInsurance > 0 && insuranceRefund > 0 && (
                      <div className={styles.priceLine}>
                        <span><Dyn>Insurance (refundable)</Dyn></span>
                        <span style={{ fontWeight: 600 }}>{money(insuranceRefund)}</span>
                      </div>
                    )}
                    {nbTax > 0 && (
                      <div className={styles.priceLine}>
                        <span><Dyn>Tax</Dyn></span>
                        <span style={{ fontWeight: 600 }}>{money(nbTax)}</span>
                      </div>
                    )}
                    {swapFee > 0 && (
                      <div className={styles.priceLine}>
                        <span><Dyn>Swap fee</Dyn></span>
                        <span style={{ fontWeight: 600 }}>+{money(swapFee)}</span>
                      </div>
                    )}
                    {newTotal !== null && (
                      <>
                        <div className={styles.priceDivider} />
                        <div className={styles.totalRow}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}><Dyn>New total</Dyn> ({unitLabel}s)</span>
                          <b>{money(newTotal)}</b>
                        </div>
                      </>
                    )}
                  </>
                )}

                {depositTopup > 0 && (
                  <div className={styles.priceLine}>
                    <span><Dyn>Extra security deposit (refundable)</Dyn></span>
                    <span>{money(depositTopup)}</span>
                  </div>
                )}

                <div className={styles.priceDivider} />
                {totalDueNow > 0 ? (
                  <div className={styles.totalRow}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--brass)' }}><Dyn>Due now</Dyn>{swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}</span>
                    <b style={{ color: 'var(--brass)' }}>{money(totalDueNow)}</b>
                  </div>
                ) : refundAmount > 0 ? (
                  <div className={styles.totalRow}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}><Dyn>Refund due</Dyn>{swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}</span>
                    <b>{money(refundAmount)}</b>
                  </div>
                ) : (
                  <div className={styles.priceEmpty}><Dyn>No additional charge for this swap.</Dyn></div>
                )}
              </div>
            ) : (
              <p style={{ marginTop: '1.2rem', color: 'var(--text-muted)' }}><Dyn>Calculating new price...</Dyn></p>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', insetInline: 0, bottom: 0, zIndex: 40, borderTop: '1px solid var(--line)', background: 'var(--paper)', backdropFilter: 'blur(6px)' }}>
        <div className={styles.container} style={{ maxWidth: '56rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingBlock: '0.9rem' }}>
          <div style={{ minWidth: 180, flex: 1 }}>
            {error ? (
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)' }}>{t(error)}</div>
            ) : previewLoading ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Dyn>Calculating...</Dyn></div>
            ) : selectedVehicle && preview && !allowed ? (
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)' }}>{t(preview.reason || 'This swap is not allowed.')}</div>
            ) : selectedVehicle && preview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{selectedVehicle.name}</span>
                <span style={{ borderRadius: 20, padding: '0.2rem 0.55rem', fontSize: '0.72rem', fontWeight: 600, background: additionalCharge > 0 ? 'color-mix(in srgb, var(--danger) 12%, var(--card))' : refundAmount > 0 ? 'color-mix(in srgb, var(--brass) 14%, var(--card))' : 'var(--card)', color: additionalCharge > 0 ? 'var(--danger)' : refundAmount > 0 ? 'var(--brass)' : 'var(--text-muted)' }}>
                  {additionalCharge > 0
                    ? `+${money(additionalCharge)}`
                    : refundAmount > 0
                      ? `−${money(refundAmount)} ${t('refund')}`
                      : t('No change')}
                  {swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Dyn>Select a vehicle to continue.</Dyn></div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button type="button" onClick={() => router.push(cancelHref)} className={`${styles.btn} ${styles.btnGhost}`}>
              <Dyn>Cancel</Dyn>
            </button>
            <button
              type="button"
              disabled={!selectedVehicle || previewLoading || !allowed || confirming}
              onClick={handleConfirm}
              className={`${styles.btn} ${styles.btnBrass}`}
              style={{ opacity: !selectedVehicle || previewLoading || !allowed || confirming ? 0.5 : 1 }}
            >
              {confirming ? t('Processing...') : t('Confirm change')} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
