'use client';

import { use } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { ArrowRight, Check, Swap } from '@/components/ui/icons';
import { FleetPagination } from '@/components/fleet/fleet-pagination';
import { paths } from '@/lib/paths';
import { cn, money } from '@/lib/utils';
import { Dyn } from '@/components/i18n/Dyn';
import { useVehicleSwap } from './use-vehicle-swap';
import SwapVehicleClientT2 from './swap-client-t2';

export default function SwapVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vs = useVehicleSwap(id);

  if (vs.tenant.websiteTemplate === 'template_2') {
    return <SwapVehicleClientT2 id={id} />;
  }

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
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-[80px] pb-[120px] text-center">
          <p className="text-[15px] font-semibold text-ink"><Dyn>Booking not found.</Dyn></p>
          <BackLink href={paths.booking(id)}><Dyn>Back to booking</Dyn></BackLink>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-[22px] pb-[120px]">
        <BackLink href={cancelHref}><Dyn>Back to booking</Dyn></BackLink>

        <h1 className="mt-[14px] text-2xl font-semibold tracking-[-0.01em] text-ink"><Dyn>Change your vehicle</Dyn></h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          <Dyn>Pick a different vehicle for the same dates. Any price difference is shown before you confirm.</Dyn>
        </p>

        {booking && (
          <div className="mt-[22px] flex items-center gap-4 rounded-2xl border-[1.5px] border-primary bg-primary-soft px-[22px] py-5">
            <div
              className="h-[70px] w-[100px] flex-shrink-0 rounded-[11px] bg-cover bg-center"
              style={{ backgroundImage: `url('${booking.vehicle.image}')` }}
            />
            <div className="flex-1">
              <div className="text-[10px] font-semibold tracking-[0.06em] text-primary uppercase"><Dyn>Current vehicle</Dyn></div>
              <div className="my-[3px] text-[17px] font-semibold text-secondary">{booking.vehicle.name}</div>
              <div className="text-[12.5px] text-muted">
                {booking.vehicle.licensePlate}
                {booking.invoice.items[0]?.pricePerDay
                  ? ` · ${money(booking.invoice.items[0].pricePerDay)}/${booking.invoice.items[0].unit || 'day'}`
                  : ''}
              </div>
            </div>
            <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white min-[560px]:flex">
              <Swap size={18} className="text-primary" />
            </span>
          </div>
        )}

        <div className="mt-[26px] mb-[14px] text-[15px] font-semibold text-ink"><Dyn>Available vehicles</Dyn></div>
        {loading ? (
          <p className="py-12 text-center text-[13px] text-muted"><Dyn>Loading vehicles...</Dyn></p>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-chip-2 px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink"><Dyn>No other vehicles available for swap right now.</Dyn></p>
            <p className="mt-1 text-[12.5px] text-muted">
              <Dyn>Please check back later or contact support if you need a specific change.</Dyn>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => {
              const vid = String(v.id);
              const isSelected = selected === vid;
              const image = v.image || '/images/vehicles/car_placeholder.svg';
              const unitPrice = v.pricePerDay || v.pricePerHour || 0;
              return (
                <button
                  key={vid}
                  onClick={() => setSelected(vid)}
                  className={cn(
                    'flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-colors',
                    isSelected ? 'border-[1.5px] border-primary bg-primary-soft' : 'border-card-border hover:border-primary',
                  )}
                >
                  <div className="relative h-[140px] w-full bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }}>
                    {v.vehicleType && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-[10px] py-[4px] text-[10px] font-semibold text-secondary">
                        {v.vehicleType}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute right-3 top-3 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary">
                        <Check size={15} strokeWidth={3} className="text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-[18px]">
                    <div className="text-[15px] font-semibold text-secondary">{v.name}</div>
                    <div className="mt-[3px] text-[11.5px] text-faint">
                      {v.year ? `${v.year}` : ''}
                      {v.seats ? `${v.year ? ' · ' : ''}${v.seats} ${t('seats')}` : ''}
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[17px] font-bold text-secondary">
                          {money(unitPrice)}
                          <span className="text-[11px] font-medium text-faint">/{v.pricePerDay ? 'day' : 'hour'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-7 flex justify-center">
            <FleetPagination
              page={page}
              totalPages={totalPages}
              onPage={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {selectedVehicle && (
          <div className="mt-8 rounded-2xl border border-card-border bg-subtle p-6">
            <div className="mb-[14px] text-sm font-semibold text-ink"><Dyn>Review your change</Dyn></div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="flex items-center gap-3">
                <div
                  className="h-[58px] w-[84px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url('${booking?.vehicle.image}')` }}
                />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-faint"><Dyn>Current</Dyn></div>
                  <div className="text-[14px] font-semibold text-secondary">{booking?.vehicle.name}</div>
                  <div className="text-[12px] text-muted">{money(currentTotal)}</div>
                </div>
              </div>

              <span className="hidden h-9 w-9 items-center justify-center justify-self-center rounded-full bg-white sm:flex">
                <ArrowRight size={16} className="text-primary" />
              </span>

              <div className="flex items-center gap-3">
                <div
                  className="h-[58px] w-[84px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url('${newVehicleImage}')` }}
                />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-primary"><Dyn>New</Dyn></div>
                  <div className="text-[14px] font-semibold text-secondary">{newVehicleName}</div>
                  <div className="text-[12px] text-muted">
                    {newVehiclePrice ? `${money(newVehiclePrice)}/${newFleet?.pricePerDay || selectedVehicle?.pricePerDay ? 'day' : 'hour'}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {previewLoading ? (
              <p className="mt-5 text-[12.5px] text-faint"><Dyn>Calculating new price...</Dyn></p>
            ) : preview && !allowed ? (
              <p className="mt-5 text-[12.5px] font-medium text-red-600">{t(preview.reason || 'This swap is not allowed.')}</p>
            ) : preview && allowed ? (
              <div className="mt-5 space-y-[10px]">
                {nb && (
                  <>
                    <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint"><Dyn>New vehicle breakdown</Dyn></div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-secondary"><Dyn>Base price</Dyn></span>
                      <span className="font-medium text-ink">{money(nbBase)}</span>
                    </div>
                    {nbLocation > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary"><Dyn>Location charges</Dyn></span>
                        <span className="font-medium text-ink">{money(nbLocation)}</span>
                      </div>
                    )}
                    {nbFees > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary"><Dyn>Fees</Dyn></span>
                        <span className="font-medium text-ink">{money(nbFees)}</span>
                      </div>
                    )}
                    {nbInsurance > 0 && insuranceRefund > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary"><Dyn>Insurance (refundable)</Dyn></span>
                        <span className="font-medium text-ink">{money(insuranceRefund)}</span>
                      </div>
                    )}
                    {nbTax > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary"><Dyn>Tax</Dyn></span>
                        <span className="font-medium text-ink">{money(nbTax)}</span>
                      </div>
                    )}
                    {swapFee > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-secondary"><Dyn>Swap fee</Dyn></span>
                        <span className="font-medium text-ink">+{money(swapFee)}</span>
                      </div>
                    )}
                    {newTotal !== null && (
                      <>
                        <div className="my-1 h-px bg-card-border" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink"><Dyn>New total</Dyn> ({unitLabel}s)</span>
                          <span className="text-[17px] font-bold text-ink">{money(newTotal)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {depositTopup > 0 && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted">
                      <Dyn>Extra security deposit (refundable)</Dyn>
                    </span>
                    <span className="font-medium text-ink">{money(depositTopup)}</span>
                  </div>
                )}

                <div className="my-1 h-px bg-card-border" />
                {totalDueNow > 0 ? (
                  <div className="flex items-center justify-between rounded-[10px] border border-amber-border bg-amber-bg px-4 py-[13px]">
                    <span className="text-[13px] font-semibold text-amber-text"><Dyn>Due now</Dyn>{swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}</span>
                    <span className="text-[15px] font-bold text-amber-text-2">{money(totalDueNow)}</span>
                  </div>
                ) : refundAmount > 0 ? (
                  <div className="flex items-center justify-between rounded-[10px] border border-green-border-2 bg-green-bg px-4 py-[13px]">
                    <span className="text-[13px] font-semibold text-success"><Dyn>Refund due</Dyn>{swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}</span>
                    <span className="text-[15px] font-bold text-success">{money(refundAmount)}</span>
                  </div>
                ) : (
                  <div className="text-[12.5px] text-faint"><Dyn>No additional charge for this swap.</Dyn></div>
                )}
              </div>
            ) : (
              <p className="mt-5 text-[12.5px] text-faint"><Dyn>Calculating new price...</Dyn></p>
            )}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-4 px-6 py-[14px]">
          <div className="min-w-[180px] flex-1">
            {error ? (
              <div className="text-[12.5px] font-medium text-red-500">{t(error)}</div>
            ) : previewLoading ? (
              <div className="text-[12.5px] text-faint"><Dyn>Calculating...</Dyn></div>
            ) : selectedVehicle && preview && !allowed ? (
              <div className="text-[12.5px] font-medium text-red-500">{t(preview.reason || 'This swap is not allowed.')}</div>
            ) : selectedVehicle && preview ? (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold text-ink">{selectedVehicle.name}</span>
                <span
                  className={cn(
                    'rounded-full px-[9px] py-[3px] text-[11px] font-semibold',
                    additionalCharge > 0
                      ? 'bg-amber-bg text-amber-text-2'
                      : refundAmount > 0
                        ? 'bg-green-bg-2 text-success'
                        : 'bg-chip-2 text-muted',
                  )}
                >
                  {additionalCharge > 0
                    ? `+${money(additionalCharge)}`
                    : refundAmount > 0
                      ? `−${money(refundAmount)} ${t('refund')}`
                      : t('No change')}
                  {swapFee > 0 ? ` (incl. ${money(swapFee)} fee)` : ''}
                </span>
              </div>
            ) : (
              <div className="text-[12.5px] text-faint"><Dyn>Select a vehicle to continue.</Dyn></div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(cancelHref)}
              className="rounded-[10px] border border-line bg-white px-[22px] py-[12px] text-sm font-semibold text-ink"
            >
              <Dyn>Cancel</Dyn>
            </button>
            <button
              disabled={!selectedVehicle || previewLoading || !allowed || confirming}
              onClick={handleConfirm}
              className={cn(
                'inline-flex items-center gap-2 rounded-[10px] px-[24px] py-[12px] text-sm font-bold text-white',
                selectedVehicle && allowed && !previewLoading && !confirming
                  ? 'bg-primary hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-locked',
              )}
            >
              {confirming ? t('Processing...') : t('Confirm change')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
