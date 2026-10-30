'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { useState } from 'react';

import { SearchBarT3 } from '@/components/search/search-bar-t3';
import type { RentalModel } from '@/services/rentalServices';
import { paths } from '@/lib/paths';

interface HeroT3Props {
  pill?: string;
  headingLines: string[];
  subheading?: string;
  backgroundImage?: string | null;
}

/** The raw template's split hero: copy left, a cut-out image right,
 *  with the booking form straddling the fold beneath. The image is
 *  optional — a tenant who has not uploaded one gets the charcoal
 *  panel rather than a broken frame. */
export function HeroT3({ pill, headingLines, subheading, backgroundImage }: HeroT3Props) {
  const [model, setModel] = useState<RentalModel>('daily');
  return (
    <header className="hero dark" id="top">
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            {pill ? (
              <div className="eyebrow">
                <Dyn>{pill}</Dyn>
              </div>
            ) : null}
            {headingLines.length > 0 ? (
              <h1>
                {headingLines.map((line, i) => (
                  <span key={i}>
                    {i === headingLines.length - 1 && headingLines.length > 1 ? (
                      <em>
                        <Dyn>{line}</Dyn>
                      </em>
                    ) : (
                      <Dyn>{line}</Dyn>
                    )}
                    {i < headingLines.length - 1 ? ' ' : null}
                  </span>
                ))}
              </h1>
            ) : null}
            <div className="hero-bot">
              {subheading ? (
                <p className="lede">
                  <Dyn>{subheading}</Dyn>
                </p>
              ) : null}
              <div className="hero-ctas">
                <Link className="btn" href={paths.fleet}>
                  <Dyn>Reserve a car</Dyn> <span className="chev">›</span>
                </Link>
                <Link className="btn ghost" href={paths.manage}>
                  <Dyn>Manage Bookings</Dyn>
                </Link>
              </div>
            </div>
          </div>
          {backgroundImage ? (
            <div className="stage">
              <div className="car-cut">
                <Image src={backgroundImage} alt="" fill sizes="(max-width: 860px) 100vw, 55vw" priority unoptimized />
              </div>
            </div>
          ) : null}
        </div>
        <SearchBarT3 model={model} onModelChange={setModel} />
      </div>
    </header>
  );
}
