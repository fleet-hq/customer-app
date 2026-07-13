import { Suspense } from 'react';
import { SearchBar } from '@/components/search/search-bar';

/**
 * Standalone search-bar route used exclusively by the embed widget
 * ``<fleethq-page-embed path="/search">``. Renders just the reusable
 * SearchBar component with no hero image / marketing sections around
 * it, so a partner site (Rentel-style) can iframe an authentic-looking
 * filter bar into their own hero.
 *
 * The route is fully public and inherits the app layout's tenant
 * resolution + LayoutChrome hiding (already keyed on ``?embed=1``), so
 * no additional gating is needed.
 */
export default function EmbedSearchPage() {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1180px] px-4 py-4">
        <Suspense fallback={<div className="h-[120px] w-full animate-pulse rounded-2xl bg-slate-100" />}>
          <SearchBar variant="hero" />
        </Suspense>
      </div>
    </div>
  );
}
