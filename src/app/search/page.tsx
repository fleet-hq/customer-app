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
  const params = await searchParams;
  const bare = params.bare === '1';
  return (
    <div className="w-full">
      <SearchEmbedDropdownBoost />
      <div className={bare ? 'mx-auto w-full max-w-[1180px] px-4 py-3 sm:px-6' : 'mx-auto w-full max-w-[1180px] px-4 py-4 sm:px-6'}>
        <SearchBar variant="hero" bareContainer={bare} />
      </div>
    </div>
  );
}
