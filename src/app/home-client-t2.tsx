'use client';

import { HeroT2 } from '@/components/sections/home-t2/hero-t2';
import { StatsT2 } from '@/components/sections/home-t2/stats-t2';
import { AboutT2 } from '@/components/sections/home-t2/about-t2';
import { FeaturesT2 } from '@/components/sections/home-t2/features-t2';
import { PromoBandT2 } from '@/components/sections/home-t2/promo-band-t2';
import { FleetGridT2 } from '@/components/sections/home-t2/fleet-grid-t2';
import { StepsT2 } from '@/components/sections/home-t2/steps-t2';
import { ServiceAreasT2 } from '@/components/sections/home-t2/service-areas-t2';
import { TestimonialsT2 } from '@/components/sections/home-t2/testimonials-t2';
import { FaqT2 } from '@/components/sections/home-t2/faq-t2';
import { CtaT2 } from '@/components/sections/home-t2/cta-t2';
import { SetupInProgress } from '@/components/setup-in-progress';
import { useTenant } from '@/lib/tenant-context';
import { withCompany } from '@/lib/tenant';
import { useFleetDiscountsSummary } from '@/hooks/useFleetDiscounts';

/** Template-2 home page. Same rule as home-client.tsx: every section
 *  renders ONLY when the operator has filled it in — no FE-invented
 *  copy or images. Reads the identical `tenant.sections.*` fields
 *  template 1 reads, so switching a company to template 2 changes
 *  presentation only. */
export default function HomeClientT2() {
  const tenant = useTenant();
  const { sections, images } = tenant;
  const co = (text: string) => withCompany(text, tenant.name);

  const hero = sections.hero;
  const heroHeadingLines = (hero?.heading_lines ?? []).filter((l) => l.trim().length > 0);
  const heroHasCopy = Boolean(hero?.pill || hero?.subheading || heroHeadingLines.length > 0);

  // Same weekly-discount-driven promo derivation as template 1's home page.
  const { data: discountsSummary } = useFleetDiscountsSummary();
  const weeklyTiers = (discountsSummary?.tiers ?? []).filter((t) => t.unit_type === 'week');
  const bestWeeklyPct = weeklyTiers.reduce((max, t) => (t.percentage > max ? t.percentage : max), 0);
  const promo = sections.promo?.enabled !== false && bestWeeklyPct > 0
    ? { badge: `${bestWeeklyPct}% OFF`, text: `Up to ${bestWeeklyPct}% off when you rent for 1+ weeks.` }
    : sections.promo?.enabled
      ? { badge: sections.promo.badge, text: sections.promo.text ?? '' }
      : null;

  const featureItems = sections.feature_columns?.items ?? [];
  const statItems = (sections.stats?.items ?? []).filter((s) => s.value?.trim() || s.label?.trim());
  const stepItems = (sections.steps?.items ?? []).filter((s) => s.title?.trim() || s.description?.trim());

  const fleetCopy = sections.fleet_section;
  const fleetCopyVisible = !!(fleetCopy?.eyebrow || fleetCopy?.title || fleetCopy?.description);

  // why_choose supplies the heading above the feature columns (it is
  // the "why choose us" copy); the narrative block above it has its own
  // `about` section, since template 1 has no equivalent for it.
  const whyChoose = sections.why_choose;
  const about = sections.about;
  const aboutVisible = !!(about?.title || about?.description || images.why_choose);

  const testimonialItems = sections.testimonials?.items ?? [];
  const faqItems = sections.faqs?.items ?? [];

  const cta = sections.cta;
  const ctaVisible = !!(cta?.title || cta?.description || cta?.cta_label);

  const hasAnyBodyContent =
    heroHasCopy ||
    !!images.hero ||
    statItems.length > 0 ||
    stepItems.length > 0 ||
    featureItems.length > 0 ||
    fleetCopyVisible ||
    aboutVisible ||
    testimonialItems.length > 0 ||
    faqItems.length > 0 ||
    ctaVisible;

  if (!hasAnyBodyContent) {
    return <SetupInProgress host={tenant.domain || tenant.name} compact />;
  }

  return (
    <>
      {heroHasCopy || images.hero ? (
        <HeroT2
          pill={hero?.pill ? co(hero.pill) : undefined}
          headingLines={heroHeadingLines.map(co)}
          subheading={hero?.subheading ? co(hero.subheading) : undefined}
          backgroundImage={images.hero ?? undefined}
        />
      ) : null}

      {statItems.length > 0 ? <StatsT2 items={statItems} /> : null}

      {promo ? <PromoBandT2 badge={promo.badge} text={co(promo.text ?? '')} /> : null}

      {aboutVisible ? (
        <AboutT2
          eyebrow={about?.eyebrow}
          title={co(about?.title ?? '')}
          description={co(about?.description ?? '')}
          image={images.why_choose ?? undefined}
        />
      ) : null}

      {featureItems.length > 0 ? (
        <FeaturesT2
          eyebrow={whyChoose?.eyebrow}
          title={whyChoose?.title ? co(whyChoose.title) : undefined}
          items={featureItems.map((i) => ({ ...i, description: co(i.description) }))}
        />
      ) : null}

      {fleetCopyVisible ? (
        <FleetGridT2
          eyebrow={fleetCopy?.eyebrow}
          title={co(fleetCopy?.title ?? '')}
          description={fleetCopy?.description ? co(fleetCopy.description) : undefined}
          ctaLabel={fleetCopy?.cta_label || 'See the full fleet'}
        />
      ) : null}

      {stepItems.length > 0 ? (
        <StepsT2
          eyebrow={sections.steps?.eyebrow}
          title={co(sections.steps?.title ?? '')}
          items={stepItems.map((s) => ({ ...s, description: co(s.description) }))}
        />
      ) : null}

      {sections.service_areas ? (
        <ServiceAreasT2
          eyebrow={sections.service_areas.eyebrow}
          title={co(sections.service_areas.title ?? '')}
          description={co(sections.service_areas.description ?? '')}
          items={sections.service_areas.items ?? []}
          ctaLabel={sections.service_areas.cta_label}
          ctaHref={sections.service_areas.cta_href}
        />
      ) : null}

      {testimonialItems.length > 0 ? (
        <TestimonialsT2
          eyebrow={sections.testimonials?.eyebrow}
          title={sections.testimonials?.title ?? ''}
          items={testimonialItems}
        />
      ) : null}

      {faqItems.length > 0 ? (
        <FaqT2 eyebrow={sections.faqs?.eyebrow} title={sections.faqs?.title ?? ''} items={faqItems} />
      ) : null}

      {ctaVisible ? (
        <CtaT2
          eyebrow={cta?.eyebrow}
          title={co(cta?.title ?? '')}
          description={cta?.description ? co(cta.description) : undefined}
          ctaLabel={cta?.cta_label || 'Reserve a car'}
        />
      ) : null}
    </>
  );
}
