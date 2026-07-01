'use client';
import { SearchBar } from '@/components/search/search-bar';
import { HomeHero } from '@/components/sections/home/home-hero';
import { PromoBanner } from '@/components/sections/home/promo-banner';
import { FeatureBanners } from '@/components/sections/home/feature-banners';
import { FeatureColumns } from '@/components/sections/home/feature-columns';
import { FleetCarousel } from '@/components/sections/home/fleet-carousel';
import { WhyChoose } from '@/components/sections/home/why-choose';
import { CategoryCarousel } from '@/components/sections/home/category-carousel';
import { Testimonials } from '@/components/sections/home/testimonials';
import { HomeFaq } from '@/components/sections/home/home-faq';
import { CtaBand } from '@/components/sections/home/cta-band';
import { SetupInProgress } from '@/components/setup-in-progress';
import { useTenant } from '@/lib/tenant-context';
import { withCompany } from '@/lib/tenant';
import { useFleetDiscountsSummary } from '@/hooks/useFleetDiscounts';

/** Every section below is rendered ONLY when the operator has filled
 *  it in. There are no FE-side copy or image fallbacks — a tenant
 *  without content for a surface simply hides that surface. */
export default function HomePage() {
  const tenant = useTenant();
  const { sections, images } = tenant;

  const co = (text: string) => withCompany(text, tenant.name);

  const hero = sections.hero;
  const heroHasCopy = Boolean(
    hero?.pill || hero?.subheading || (hero?.heading_lines?.length ?? 0) > 0,
  );

  // Top promo banner derives from active **weekly** fleet-discount
  // tiers only — weekly tiers all have an implicit 1-week threshold,
  // so the banner just advertises the headline percentage. Daily /
  // hourly tiers are per-fleet and don't drive this site-wide banner.
  const { data: discountsSummary } = useFleetDiscountsSummary();
  const weeklyTiers = (discountsSummary?.tiers ?? []).filter(
    (t) => t.unit_type === 'week',
  );
  const bestWeeklyPct = weeklyTiers.reduce(
    (max, t) => (t.percentage > max ? t.percentage : max),
    0,
  );
  const promoBanner =
    bestWeeklyPct > 0
      ? {
          badge: `${bestWeeklyPct}% OFF`,
          text: `Up to ${bestWeeklyPct}% off when you rent for 1+ weeks.`,
        }
      : null;

  const featureBannerImages = images.feature_banners.filter(
    (url): url is string => !!url,
  );
  const featureColumns = sections.feature_columns?.items ?? [];

  const fleetCopy = sections.fleet_section;
  const fleetCopyVisible = !!(fleetCopy?.eyebrow || fleetCopy?.title || fleetCopy?.description);

  const whyChoose = sections.why_choose;
  const whyChooseVisible = !!(whyChoose?.title || whyChoose?.description || images.why_choose);

  const categories = sections.categories;
  const categoriesVisible = !!(categories?.eyebrow || categories?.title || categories?.description);

  const testimonialItems = sections.testimonials?.items ?? [];
  const faqItems = sections.faqs?.items ?? [];

  const cta = sections.cta;
  const ctaVisible = !!(cta?.title || cta?.description || cta?.cta_label);

  // When the super-admin hasn't populated any body content yet, the
  // page would otherwise be just "header → search bar → footer"
  // sandwiched together, which reads as broken. Show the same
  // "Site setup in progress" placeholder we use for unmapped hosts,
  // inline this time so the header/footer still render normally.
  const hasAnyBodyContent =
    heroHasCopy ||
    !!images.hero ||
    featureBannerImages.length > 0 ||
    featureColumns.length > 0 ||
    fleetCopyVisible ||
    whyChooseVisible ||
    categoriesVisible ||
    testimonialItems.length > 0 ||
    faqItems.length > 0 ||
    ctaVisible;

  if (!hasAnyBodyContent) {
    return (
      <div className="bg-white text-ink">
        <SetupInProgress host={tenant.domain || tenant.name} compact />
      </div>
    );
  }

  return (
    <div className="bg-white text-ink">
      {heroHasCopy || images.hero ? (
        <HomeHero
          pill={co(hero?.pill ?? '')}
          headingLines={(hero?.heading_lines ?? []).map(co)}
          subheading={co(hero?.subheading ?? '')}
          backgroundImage={images.hero ?? undefined}
          mobileBackgroundImage={images.hero_mobile ?? undefined}
        />
      ) : null}

      <div className="relative z-10 mx-auto -mt-16 max-w-[1120px] px-6">
        <SearchBar variant="hero" />
        {promoBanner ? (
          <PromoBanner
            badge={promoBanner.badge}
            text={promoBanner.text}
            ctaLabel=""
          />
        ) : null}
      </div>

      {featureBannerImages.length > 0 ? <FeatureBanners images={featureBannerImages} /> : null}
      {featureColumns.length > 0 ? <FeatureColumns items={featureColumns} /> : null}

      {fleetCopyVisible ? (
        <FleetCarousel
          eyebrow={fleetCopy?.eyebrow ?? ''}
          title={fleetCopy?.title ?? ''}
          description={fleetCopy?.description ?? ''}
          ctaLabel={fleetCopy?.cta_label ?? ''}
        />
      ) : null}

      {whyChooseVisible ? (
        <WhyChoose
          eyebrow={whyChoose?.eyebrow ?? ''}
          title={co(whyChoose?.title ?? '')}
          description={co(whyChoose?.description ?? '')}
          ctaLabel={whyChoose?.cta_label ?? ''}
          image={images.why_choose ?? undefined}
        />
      ) : null}

      {categoriesVisible ? (
        <CategoryCarousel
          eyebrow={categories?.eyebrow ?? ''}
          title={categories?.title ?? ''}
          description={categories?.description ?? ''}
        />
      ) : null}

      {testimonialItems.length > 0 ? (
        <Testimonials
          eyebrow={sections.testimonials?.eyebrow ?? ''}
          title={sections.testimonials?.title ?? ''}
          items={testimonialItems}
        />
      ) : null}

      {faqItems.length > 0 ? (
        <HomeFaq
          eyebrow={sections.faqs?.eyebrow ?? ''}
          title={sections.faqs?.title ?? ''}
          items={faqItems}
        />
      ) : null}

      {ctaVisible ? (
        <CtaBand
          eyebrow={cta?.eyebrow ?? ''}
          title={cta?.title ?? ''}
          description={cta?.description ?? ''}
          ctaLabel={cta?.cta_label ?? ''}
          backgroundImage={images.cta_background ?? undefined}
        />
      ) : null}
    </div>
  );
}
