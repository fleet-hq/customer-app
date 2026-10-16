'use client';

import { AboutT3 } from '@/components/sections/home-t3/about-t3';
import { CtaT3 } from '@/components/sections/home-t3/cta-t3';
import { FaqT3 } from '@/components/sections/home-t3/faq-t3';
import { FleetGridT3 } from '@/components/sections/home-t3/fleet-grid-t3';
import { HeroT3 } from '@/components/sections/home-t3/hero-t3';
import { StatsT3 } from '@/components/sections/home-t3/stats-t3';
import { StepsT3 } from '@/components/sections/home-t3/steps-t3';
import { TickerT3 } from '@/components/sections/home-t3/ticker-t3';
import { WhyT3 } from '@/components/sections/home-t3/why-t3';
import { SetupInProgress } from '@/components/setup-in-progress';
import { paths } from '@/lib/paths';
import { withCompany } from '@/lib/tenant';
import { useTenant } from '@/lib/tenant-context';

/** Template-3 home page.
 *
 *  Reads the identical `tenant.sections.*` fields templates 1 and 2
 *  read, so moving a company between templates changes presentation
 *  and nothing else. Same hard rule as the other two: a section
 *  renders only when the operator has filled it in — no front-end
 *  invented copy, and no demo cars from the raw mockup. */
export default function HomeClientT3() {
  const tenant = useTenant();
  const { sections, images } = tenant;
  const co = (text: string) => withCompany(text, tenant.name);

  const hero = sections.hero;
  const heroHeadingLines = (hero?.heading_lines ?? []).filter((l) => l.trim().length > 0);
  const heroHasCopy = Boolean(hero?.pill || hero?.subheading || heroHeadingLines.length > 0);

  const statItems = (sections.stats?.items ?? []).filter(
    (s) => s.value?.trim() || s.label?.trim(),
  );
  const stepItems = (sections.steps?.items ?? []).filter(
    (s) => s.title?.trim() || s.description?.trim(),
  );
  const featureItems = sections.feature_columns?.items ?? [];
  const faqItems = sections.faqs?.items ?? [];

  const about = sections.about;
  const aboutVisible = !!(about?.title || about?.description);

  const whyChoose = sections.why_choose;
  const whyVisible = featureItems.length > 0 || !!whyChoose?.title;

  const fleetCopy = sections.fleet_section;
  const fleetCopyVisible = !!(fleetCopy?.eyebrow || fleetCopy?.title);

  const areas = (sections.service_areas?.items ?? [])
    .map((item) => item?.label ?? '')
    .filter((name) => name.trim().length > 0);

  const cta = sections.cta;
  const ctaVisible = !!(cta?.title || cta?.eyebrow);

  // The closing CTA offers a second action only when the tenant has an
  // application form configured, so no company ever shows an "Apply
  // now" button that leads to a page they have not set up. /inquiry is
  // the shared route templates 1 and 2 already use for this form.
  const applyHref = sections.inquiry_form ? paths.inquiry : undefined;

  const hasAnyBodyContent =
    heroHasCopy ||
    !!images.hero ||
    statItems.length > 0 ||
    stepItems.length > 0 ||
    featureItems.length > 0 ||
    fleetCopyVisible ||
    aboutVisible ||
    faqItems.length > 0 ||
    ctaVisible;

  if (!hasAnyBodyContent) {
    return <SetupInProgress host={tenant.domain || tenant.name} compact />;
  }

  return (
    <>
      {heroHasCopy || images.hero ? (
        <HeroT3
          pill={hero?.pill ? co(hero.pill) : undefined}
          headingLines={heroHeadingLines.map(co)}
          subheading={hero?.subheading ? co(hero.subheading) : undefined}
          backgroundImage={images.hero}
        />
      ) : null}

      <TickerT3 areas={areas} label={sections.service_areas?.title ?? undefined} />

      <StatsT3 items={statItems} />

      {fleetCopyVisible ? (
        <FleetGridT3
          eyebrow={fleetCopy?.eyebrow}
          title={co(fleetCopy?.title ?? '')}
          ctaLabel={fleetCopy?.cta_label || undefined}
        />
      ) : null}

      {aboutVisible ? (
        <AboutT3
          eyebrow={about?.eyebrow}
          title={co(about?.title ?? '')}
          description={co(about?.description ?? '')}
        />
      ) : null}

      {whyVisible ? (
        <WhyT3
          eyebrow={whyChoose?.eyebrow}
          title={whyChoose?.title ? co(whyChoose.title) : undefined}
          items={featureItems.map((item) => ({
            title: item.title,
            description: co(item.description ?? ''),
          }))}
          image={images.why_choose}
          badgeValue={statItems[0]?.value}
          badgeLabel={statItems[0]?.label}
        />
      ) : null}

      {stepItems.length > 0 ? (
        <StepsT3
          eyebrow={sections.steps?.eyebrow}
          title={co(sections.steps?.title ?? '')}
          items={stepItems.map((s) => ({
            title: s.title,
            description: co(s.description ?? ''),
          }))}
        />
      ) : null}

      {faqItems.length > 0 ? (
        <FaqT3
          eyebrow={sections.faqs?.eyebrow}
          title={sections.faqs?.title ?? ''}
          items={faqItems}
          phone={tenant.footer.contact.phone}
        />
      ) : null}

      {ctaVisible ? (
        <CtaT3
          eyebrow={cta?.eyebrow}
          title={co(cta?.title ?? '')}
          buttonLabel={cta?.cta_label || undefined}
          applyHref={applyHref}
        />
      ) : null}
    </>
  );
}
