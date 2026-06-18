'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
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
import { useTenant } from '@/lib/tenant-context';
import { getSiteContent, withCompany } from '@/lib/site-content';

export default function HomePage() {
  const tenant = useTenant();
  const { home } = getSiteContent(tenant.slug);
  const headingLines = home.hero.headingLines.map((line) => withCompany(line, tenant.name));

  return (
    <div className="bg-white text-ink">
      <Header active="About" />

      <HomeHero pill={withCompany(home.hero.pill, tenant.name)} headingLines={headingLines} subheading={home.hero.subheading} />

      <div className="relative z-10 mx-auto -mt-16 max-w-[1120px] px-6">
        <SearchBar variant="hero" />
        <PromoBanner badge={home.promo.badge} text={home.promo.text} ctaLabel={home.promo.ctaLabel} />
      </div>

      <FeatureBanners />
      <FeatureColumns items={home.featureColumns} />
      <FleetCarousel
        eyebrow={home.fleet.eyebrow}
        title={home.fleet.title}
        description={home.fleet.description}
        ctaLabel={home.fleet.ctaLabel}
      />
      <WhyChoose
        eyebrow={home.whyChoose.eyebrow}
        title={home.whyChoose.title}
        description={home.whyChoose.description}
        ctaLabel={home.whyChoose.ctaLabel}
        image={home.whyChoose.image}
      />
      <CategoryCarousel
        eyebrow={home.categories.eyebrow}
        title={home.categories.title}
        description={home.categories.description}
        items={home.categories.items}
      />
      <Testimonials eyebrow={home.testimonials.eyebrow} title={home.testimonials.title} items={home.testimonials.items} />
      <HomeFaq eyebrow={home.faq.eyebrow} title={home.faq.title} items={home.faq.items} />
      <CtaBand
        eyebrow={home.cta.eyebrow}
        title={home.cta.title}
        description={home.cta.description}
        ctaLabel={home.cta.ctaLabel}
      />

      <Footer />
    </div>
  );
}
