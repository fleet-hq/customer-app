'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Carousel, CarouselArrows, type CarouselHandle } from '@/components/ui/carousel';

interface CategoryItem {
  name: string;
  price: string;
  image: string;
  href: string;
}

interface CategoryCarouselProps {
  eyebrow: string;
  title: string;
  description: string;
  items: CategoryItem[];
}

export function CategoryCarousel({ eyebrow, title, description, items }: CategoryCarouselProps) {
  const ref = useRef<CarouselHandle>(null);

  return (
    <section className="bg-subtle py-[56px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between md:gap-[32px]">
          <div className="max-w-[680px]">
            <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">{eyebrow}</div>
            <h2 className="m-0 mb-[12px] text-[23px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            <p className="m-0 text-[12px] leading-[1.7] text-muted">{description}</p>
          </div>
          <CarouselArrows onPrev={() => ref.current?.scroll(-1)} onNext={() => ref.current?.scroll(1)} />
        </div>
        <Carousel ref={ref} className="mt-[30px] gap-[16px]">
          {items.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="relative block h-[380px] w-[270px] flex-shrink-0 overflow-hidden rounded-[16px] bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 36%, rgba(0,0,0,0.86) 100%), url('${cat.image}')`,
              }}
            >
              <span className="absolute top-[22px] right-[22px] left-[22px] text-[20px] font-semibold tracking-[-0.01em] text-white">
                {cat.name}
              </span>
              <div className="absolute right-[22px] bottom-[22px] left-[22px] flex items-end justify-between">
                <div>
                  <div className="mb-[4px] text-[12px] text-white/70">Starting From</div>
                  <div className="text-[22px] font-bold text-white">
                    {cat.price}
                    <span className="text-[12px] font-normal text-white/70">/day</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-[5px] text-[13px] font-semibold text-white">
                  Explore
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
