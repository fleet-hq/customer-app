'use client';

import Link from 'next/link';

import { Dyn } from '@/components/i18n/Dyn';
import { cn, money } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import type { RentalTab } from '@/lib/rental-tabs';
import type { PublicPlan, RentalModel } from '@/services/rentalServices';

export interface RentalTabsState {
  tabs: RentalTab[];
  active: RentalModel;
  modelOff: boolean;
  plans: PublicPlan[];
  selectedPlan: PublicPlan | null;
  showPlans: boolean;
  emptyText: string | null;
}

function useSkin() {
  const isT2 = useIsT2();
  return {
    strong: isT2 ? 'text-[var(--text)]' : 'text-ink',
    quiet: isT2 ? 'text-[var(--text-muted)]' : 'text-muted',
    card: isT2 ? 'border-[var(--line)] bg-[var(--card)]' : 'border-card-border bg-white',
    tab: isT2 ? 'border-[var(--line)] text-[var(--text-muted)]' : 'border-card-border text-muted',
    tabOn: isT2 ? 'border-[var(--brass)] bg-[var(--brass)] text-[var(--paper)]' : 'border-secondary bg-secondary text-white',
    link: isT2 ? 'text-[var(--brass)]' : 'text-primary',
  };
}

export function RentalModelBar({ state }: { state: RentalTabsState }) {
  const skin = useSkin();
  if (state.modelOff) {
    return (
      <div className={cn('mb-6 rounded-[14px] border p-5 text-[14px]', skin.card, skin.strong)}>
        <Dyn>This option is no longer available</Dyn>.{' '}
        <Link href="/fleet" className={cn('font-semibold', skin.link)}>
          <Dyn>Browse cars by the day</Dyn>
        </Link>
      </div>
    );
  }
  if (state.tabs.length === 0 && !state.selectedPlan) return null;
  return (
    <div className="mb-6 flex flex-col gap-3">
      {state.tabs.length > 0 ? (
        <nav aria-label="How you rent" className="flex flex-wrap gap-2">
          {state.tabs.map((tab) => (
            <Link
              key={tab.model}
              href={tab.href}
              aria-current={tab.model === state.active ? 'page' : undefined}
              className={cn(
                'rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors',
                tab.model === state.active ? skin.tabOn : skin.tab,
              )}
            >
              <Dyn>{tab.label}</Dyn>
            </Link>
          ))}
        </nav>
      ) : null}
      {state.selectedPlan ? (
        <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]', skin.quiet)}>
          <Link href="/subscribe" className={cn('font-semibold', skin.link)}>
            ‹ <Dyn>All plans</Dyn>
          </Link>
          <span>{planTerms(state.selectedPlan).join(' · ')}</span>
        </div>
      ) : null}
    </div>
  );
}

function planTerms(plan: PublicPlan): string[] {
  return [
    `${money(Number(plan.weekly_price))}/week`,
    plan.miles_per_week ? `${plan.miles_per_week.toLocaleString()} miles/week` : 'Unlimited miles',
    plan.min_term_weeks ? `Minimum ${plan.min_term_weeks} weeks` : null,
    Number(plan.setup_fee) > 0 ? `${money(Number(plan.setup_fee))} setup fee` : null,
  ].filter((term): term is string => !!term);
}

export function PlanPicker({ plans }: { plans: PublicPlan[] }) {
  const skin = useSkin();
  if (plans.length === 0) {
    return (
      <p className={cn('py-16 text-center text-[14px]', skin.quiet)}>
        <Dyn>No subscription plans are available right now.</Dyn>
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const [price, ...rest] = planTerms(plan);
        return (
          <Link
            key={plan.id}
            href={`/subscribe?plan=${plan.id}`}
            className={cn('flex flex-col gap-3 rounded-[16px] border p-5 transition-shadow hover:shadow-[var(--shadow-card)]', skin.card)}
          >
            <div className={cn('text-[18px] font-semibold', skin.strong)}>{plan.name}</div>
            <div className={cn('text-[24px] font-bold', skin.strong)}>{price}</div>
            <ul className={cn('flex flex-col gap-1 text-[13px]', skin.quiet)}>
              {rest.map((term) => (
                <li key={term}><Dyn>{term}</Dyn></li>
              ))}
            </ul>
            {plan.description ? <p className={cn('text-[13px] leading-[1.6]', skin.quiet)}>{plan.description}</p> : null}
            <span className={cn('mt-auto text-[13px] font-semibold', skin.link)}><Dyn>See cars in this plan</Dyn> ›</span>
          </Link>
        );
      })}
    </div>
  );
}
