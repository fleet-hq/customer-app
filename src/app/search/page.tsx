import { Suspense } from 'react';
import { SearchBar } from '@/components/search/search-bar';
import { SearchEmbedDropdownBoost } from './dropdown-boost';

/**
 * Standalone search-bar route used exclusively by the embed widget
 * ``<fleethq-page-embed path="/search">``. Renders just the reusable
 * SearchBar component with no hero image / marketing sections around
 * it, so a partner site (Rentel-style) can iframe an authentic-looking
 * filter bar into their own hero.
 *
 * ``?bare=1`` drops the outer white card so the partner's own hero
 * background shows through.
 */
export default function EmbedSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ bare?: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-[120px] w-full animate-pulse rounded-2xl bg-slate-100" />}>
      <EmbedSearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function EmbedSearchContent({
  searchParams,
}: {
  searchParams: Promise<{ bare?: string }>;
}) {
  await searchParams;
  // Always keep SearchBar's own rounded white card so the widget matches
  // the customer-central hero on every tenant's home page. The paired
  // ``?bare=1`` handling in LayoutChrome takes care of dropping the
  // <main> element's white fill so the partner's own hero background
  // still shows through around the card.
  return (
    <div className="w-full">
      <SearchEmbedDropdownBoost />
      <div className="mx-auto w-full max-w-[1180px] px-4 py-4 sm:px-6">
        <SearchBar variant="hero" />
      </div>
    </div>
  );
}
