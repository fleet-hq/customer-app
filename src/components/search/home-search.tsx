'use client';

import { useState } from 'react';

import { ModelSplit } from '@/components/search/model-split';
import { SearchBar } from '@/components/search/search-bar';
import { useRentalSiteConfig } from '@/hooks/useRentalSiteConfig';
import { RENTAL_TABS } from '@/lib/rental-tabs';
import type { RentalModel } from '@/services/rentalServices';

export function HomeSearch() {
  const { bookableModels } = useRentalSiteConfig();
  const [model, setModel] = useState<RentalModel>('daily');
  const tabs = RENTAL_TABS.filter((tab) => bookableModels.includes(tab.model));
  const active = bookableModels.includes(model) ? model : 'daily';

  return (
    <div>
      <ModelSplit tabs={tabs} active={active} onPick={setModel} />
      <SearchBar variant="hero" model={active} attached={tabs.length > 1} />
    </div>
  );
}
