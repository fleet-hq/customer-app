'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Carousel, CarouselArrows, type CarouselHandle } from '@/components/ui/carousel';
import { CarCard } from '@/components/fleet/car-card';
import { ArrowRight } from '@/components/ui/icons';
import { paths } from '@/lib/paths';
import { useFleets } from '@/hooks';

interface FleetCarouselProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export function FleetCarousel({ eyebrow, title, description, ctaLabel }: FleetCarouselProps) {
  const ref = useRef<CarouselHandle>(null);
  const { data } = useFleets(1, '', 12);
  const vehicles = data?.results ?? [];

  return (
    <section className="bg-subtle py-[56px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between md:gap-[32px]">
          <div className="max-w-[680px]">
            <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">{eyebrow}</div>
            <h2 className="m-0 mb-[12px] text-[23px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            <p className="m-0 text-[12px] leading-[1.7] text-muted">{description}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-[10px]">
            <CarouselArrows onPrev={() => ref.current?.scroll(-1)} onNext={() => ref.current?.scroll(1)} />
            <Link
              href={paths.fleet}
              className="inline-flex items-center gap-[7px] rounded-[8px] bg-primary px-[22px] py-[10px] text-[14px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-primary-hover"
            >
              {ctaLabel}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <Carousel ref={ref} className="mt-[30px] gap-[18px]">
          {vehicles.map((v) => (
            <div key={v.id} className="w-[246px] flex-shrink-0">
              <CarCard vehicle={v} />
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
