import type { ReactNode, SVGProps } from 'react';
import {
  Calendar,
  Car,
  Plane,
  ShieldCheck,
  Headset,
  Clock,
  Star,
  MapPin,
  Key,
  Check,
  Sparkles,
} from '@/components/ui/icons';

type IconCmp = (p: SVGProps<SVGSVGElement> & { size?: number }) => ReactNode;

const FEATURE_ICONS: Record<string, IconCmp> = {
  calendar: Calendar,
  car: Car,
  plane: Plane,
  shield: ShieldCheck,
  headset: Headset,
  clock: Clock,
  star: Star,
  'map-pin': MapPin,
  key: Key,
  check: Check,
  sparkles: Sparkles,
};

export interface HeroFeature {
  icon?: string;
  title?: string;
  description?: string;
}

interface HomeHeroFeaturedProps {
  headingLines: string[];
  subheading: string;
  highlightColor?: string;
  highlightWords?: string[];
  backgroundImage?: string;
  mobileBackgroundImage?: string;
  features?: HeroFeature[];
}

export function HomeHeroFeatured({
  headingLines,
  subheading,
  highlightColor,
  highlightWords,
  backgroundImage,
  mobileBackgroundImage,
  features,
}: HomeHeroFeaturedProps) {
  const color = highlightColor || 'var(--color-primary)';
  const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wordSet = new Set((highlightWords ?? []).map(normalize).filter(Boolean));
  const items = (features ?? []).filter((f) => f?.title || f?.icon).slice(0, 5);
  const hasBg = !!backgroundImage;
  const hasMobileBg = !!mobileBackgroundImage;

  const renderLine = (line: string) => {
    if (wordSet.size === 0) return line;
    return line.split(/(\s+)/).map((part, i) => {
      const clean = normalize(part);
      return clean && wordSet.has(clean) ? (
        <span key={i} style={{ color }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      );
    });
  };

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-secondary)' }}
    >
      {hasBg ? (
        <>
          {hasMobileBg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mobileBackgroundImage}
              alt=""
              className="block h-auto max-h-[86vh] w-full object-contain sm:hidden"
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImage}
            alt=""
            className={`block h-auto max-h-[86vh] w-full object-contain ${hasMobileBg ? 'hidden sm:block' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        </>
      ) : (
        <div className="min-h-[560px] w-full md:min-h-[640px]" />
      )}

      <div className="absolute inset-0 z-10 flex flex-col justify-between pb-8 md:pb-10">
        <div className="flex flex-1 flex-col justify-center px-6 pt-[110px] pb-10 md:px-14 md:pt-[130px]">
          <div className="max-w-[620px]">
            {headingLines.length > 0 ? (
              <h1 className="m-0 text-[40px] leading-[0.98] font-extrabold tracking-[-0.02em] text-white uppercase sm:text-[52px] md:text-[68px]">
                {headingLines.map((line, i) => (
                  <span key={i} className="block">
                    {renderLine(line)}
                  </span>
                ))}
              </h1>
            ) : null}
            {subheading ? (
              <p className="mt-5 max-w-[440px] text-[15px] leading-[1.55] text-white/85 md:text-[17px]">
                {subheading}
              </p>
            ) : null}
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-y-4 px-6 py-6 sm:grid-cols-3 md:flex md:items-center md:justify-between md:px-14">
            {items.map((f, i) => {
              const Icon = FEATURE_ICONS[(f.icon || '').toLowerCase()] ?? Sparkles;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 md:flex-1 md:justify-center"
                >
                  <span className="shrink-0 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                    <Icon size={32} strokeWidth={1.3} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold tracking-[0.05em] text-white uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                      {f.title}
                    </p>
                    {f.description ? (
                      <p className="text-[11px] text-white/75 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                        {f.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
