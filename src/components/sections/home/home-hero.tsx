import { MapPin } from '@/components/ui/icons';
import { HeroImage } from '@/components/sections/home/hero-image';
import { cn } from '@/lib/utils';

interface HomeHeroProps {
  pill: string;
  headingLines: string[];
  subheading: string;
  /** Admin-supplied hero background image. ``undefined`` → the hero
   *  renders against a solid brand-secondary backdrop, no bundled
   *  placeholder image. */
  backgroundImage?: string;
  /** Phone-only override — when set, viewports <640px show this image
   *  instead of ``backgroundImage`` so operators can supply a narrower
   *  crop where a landscape desktop image would center-crop badly. */
  mobileBackgroundImage?: string;
}

export function HomeHero({
  pill,
  headingLines,
  subheading,
  backgroundImage,
  mobileBackgroundImage,
}: HomeHeroProps) {
  const hasBg = !!backgroundImage;
  const hasMobileBg = !!mobileBackgroundImage;
  const hasCopy = !!pill || headingLines.length > 0 || !!subheading;

  const copy = hasCopy ? (
    <>
      {pill ? (
        <div className="mb-[14px] inline-flex items-center gap-[6px] rounded-full border border-white/20 bg-white/10 py-[3px] pr-[11px] pl-[9px] backdrop-blur-sm">
          <MapPin size={12} strokeWidth={2} className="text-primary" />
          <span className="text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap text-white/90 uppercase">
            {pill}
          </span>
        </div>
      ) : null}
      {headingLines.length > 0 ? (
        <h1 className="m-0 max-w-[1000px] text-[26px] leading-[1.16] font-semibold tracking-[-0.024em] text-white sm:text-[32px] md:text-[36px]">
          {headingLines.map((line) => (
            <span key={line} className="block sm:whitespace-nowrap">
              {line}
            </span>
          ))}
        </h1>
      ) : null}
      {subheading ? (
        <p className="mt-[20px] max-w-[540px] text-[13px] leading-[1.6] font-normal text-white/85">
          {subheading}
        </p>
      ) : null}
    </>
  ) : null;

  // Hero WITH overlaid copy: the image is a backdrop that cover-fills a
  // guaranteed-height section, so the copy always fits and is never
  // clipped by a too-short landscape image on mobile. The bottom padding
  // keeps the copy clear of the search bar that overlaps the hero's base.
  if (hasBg && hasCopy) {
    return (
      <section
        className="relative flex min-h-[540px] w-full flex-col items-center justify-center overflow-hidden sm:min-h-[600px]"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      >
        {hasMobileBg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mobileBackgroundImage!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover sm:hidden"
          />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundImage!}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            hasMobileBg && 'hidden sm:block',
          )}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex flex-col items-center px-6 pb-[92px] text-center sm:pb-[104px]">
          {copy}
        </div>
      </section>
    );
  }

  // No overlaid copy (the image itself is the hero) or no image at all:
  // keep the aspect-aware behavior (landscape fills width uncropped;
  // only tall/square images are capped by HeroImage).
  return (
    <section
      className="relative flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--color-secondary)' }}
    >
      {hasBg ? (
        <>
          {hasMobileBg ? (
            <HeroImage src={mobileBackgroundImage!} className="sm:hidden" />
          ) : null}
          <HeroImage src={backgroundImage!} className={hasMobileBg ? 'hidden sm:block' : ''} />
        </>
      ) : (
        <div className="min-h-[500px] w-full md:min-h-[580px]" />
      )}
    </section>
  );
}
