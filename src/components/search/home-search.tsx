'use client';

import { useState } from 'react';

import { Dyn } from '@/components/i18n/Dyn';
import { SearchBar } from '@/components/search/search-bar';
import { useRentalSiteConfig } from '@/hooks/useRentalSiteConfig';
import { RENTAL_TABS } from '@/lib/rental-tabs';
import { cn } from '@/lib/utils';
import { useIsT2 } from '@/lib/use-is-t2';
import type { RentalModel } from '@/services/rentalServices';

export function HomeSearch() {
  const { bookableModels } = useRentalSiteConfig();
  const [model, setModel] = useState<RentalModel>('daily');
  const isT2 = useIsT2();
  const tabs = RENTAL_TABS.filter((tab) => bookableModels.includes(tab.model));
  const active = bookableModels.includes(model) ? model : 'daily';

  return (
    <div>
      {tabs.length > 1 && (
        <div className="mb-[14px] flex flex-wrap gap-[8px]">
          {tabs.map((tab) => (
            <button
              key={tab.model}
              type="button"
              onClick={() => setModel(tab.model)}
              className={cn(
                'cursor-pointer rounded-full border px-[16px] py-[8px] text-[13px] font-semibold transition-colors',
                tab.model === active
                  ? isT2
                    ? 'border-transparent bg-[var(--brass)] text-[var(--on-brass)]'
                    : 'border-transparent bg-secondary text-white'
                  : isT2
                    ? 'border-[var(--line-strong)] bg-[var(--card)] text-[var(--text-muted)]'
                    : 'border-line bg-white text-label',
              )}
            >
              <Dyn>{tab.label}</Dyn>
            </button>
          ))}
        </div>
      )}
      <SearchBar variant="hero" model={active} />
    </div>
  );
}
