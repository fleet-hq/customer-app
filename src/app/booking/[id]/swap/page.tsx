'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { ArrowRight, Check, Star, Swap } from '@/components/ui/icons';
import { getVehicle, VEHICLES, SAMPLE_BOOKING } from '@/lib/mock-data';
import { paths } from '@/lib/paths';
import { cn, money } from '@/lib/utils';

export default function SwapVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const current = getVehicle(SAMPLE_BOOKING.vehicleId)!;
  const [selected, setSelected] = useState<string | null>(null);
  const selectedVehicle = VEHICLES.find((v) => v.id === selected) ?? null;
  const delta = selectedVehicle ? selectedVehicle.pricePerDay - current.pricePerDay : 0;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <section className="mx-auto w-full max-w-[1000px] flex-1 px-6 pt-[22px] pb-[120px]">
        <BackLink href={paths.booking(id)}>Back to booking</BackLink>

        <h1 className="mt-[14px] text-2xl font-semibold tracking-[-0.01em] text-ink">Change your vehicle</h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.55] text-muted">
          Pick a different vehicle for the same dates. Any price difference is shown before you confirm.
        </p>

        <div className="mt-[22px] flex items-center gap-4 rounded-2xl border-[1.5px] border-primary bg-primary-soft px-[22px] py-5">
          <div
            className="h-[70px] w-[100px] flex-shrink-0 rounded-[11px] bg-cover bg-center"
            style={{ backgroundImage: `url('${current.image}')` }}
          />
          <div className="flex-1">
            <div className="text-[10px] font-semibold tracking-[0.06em] text-primary uppercase">Current vehicle</div>
            <div className="my-[3px] text-[17px] font-semibold text-secondary">{current.name}</div>
            <div className="text-[12.5px] text-muted">{current.category} · {money(current.pricePerDay)}/day</div>
          </div>
          <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white min-[560px]:flex">
            <Swap size={18} className="text-primary" />
          </span>
        </div>

        <div className="mt-[26px] mb-[14px] text-[15px] font-semibold text-ink">Available vehicles</div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLES.map((v) => {
            const isSelected = selected === v.id;
            const isCurrent = v.id === current.id;
            const vDelta = v.pricePerDay - current.pricePerDay;
            return (
              <button
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={cn(
                  'flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-colors',
                  isSelected ? 'border-[1.5px] border-primary bg-primary-soft' : 'border-card-border hover:border-primary',
                )}
              >
                <div className="relative h-[140px] w-full bg-cover bg-center" style={{ backgroundImage: `url('${v.image}')` }}>
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-[10px] py-[4px] text-[10px] font-semibold text-secondary">
                    {v.category}
                  </span>
                  {isSelected && (
                    <span className="absolute right-3 top-3 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary">
                      <Check size={15} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-[18px]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[15px] font-semibold text-secondary">{v.name}</div>
                    <div className="flex items-center gap-[4px] text-[11.5px] font-semibold text-ink">
                      <Star size={12} className="text-accent" /> {v.rating}
                    </div>
                  </div>
                  <div className="mt-[3px] text-[11.5px] text-faint">{v.trips} trips · {v.year}</div>

                  <div className="mt-auto pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[17px] font-bold text-secondary">{money(v.pricePerDay)}<span className="text-[11px] font-medium text-faint">/day</span></span>
                      {isCurrent ? (
                        <span className="rounded-full bg-chip-2 px-[9px] py-[3px] text-[10px] font-semibold text-muted">Current</span>
                      ) : (
                        <span
                          className={cn(
                            'rounded-full px-[9px] py-[3px] text-[11px] font-semibold',
                            vDelta > 0 ? 'bg-amber-bg text-amber-text-2' : 'bg-green-bg-2 text-success',
                          )}
                        >
                          {vDelta > 0 ? '+' : '−'}{money(Math.abs(vDelta))}/day
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-4 px-6 py-[14px]">
          <div className="min-w-[180px] flex-1">
            {selectedVehicle ? (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold text-ink">{selectedVehicle.name}</span>
                {selectedVehicle.id !== current.id && (
                  <span
                    className={cn(
                      'rounded-full px-[9px] py-[3px] text-[11px] font-semibold',
                      delta > 0 ? 'bg-amber-bg text-amber-text-2' : 'bg-green-bg-2 text-success',
                    )}
                  >
                    {delta > 0 ? '+' : '−'}{money(Math.abs(delta))}/day
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[12.5px] text-faint">Select a vehicle to continue.</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(paths.booking(id))}
              className="rounded-[10px] border border-line bg-white px-[22px] py-[12px] text-sm font-semibold text-ink"
            >
              Cancel
            </button>
            <button
              disabled={!selectedVehicle || selectedVehicle.id === current.id}
              onClick={() => router.push(paths.paymentPending(id))}
              className={cn(
                'inline-flex items-center gap-2 rounded-[10px] px-[24px] py-[12px] text-sm font-bold text-white',
                selectedVehicle && selectedVehicle.id !== current.id ? 'bg-primary hover:bg-primary-hover' : 'cursor-not-allowed bg-locked',
              )}
            >
              Confirm change <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
