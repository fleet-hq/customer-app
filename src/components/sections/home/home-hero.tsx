import { MapPin } from '@/components/ui/icons';

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
  // Whether the operator overlays their own copy on the hero. When they
  // don't, the image itself IS the hero (branding + feature strip baked
  // in) — so we skip the darkening scrim and show it untouched.
  const hasCopy = !!pill || headingLines.length > 0 || !!subheading;
  return (
    <section
      className="relative flex flex-col items-center justify-center"
      style={hasBg ? undefined : { backgroundColor: 'var(--color-secondary)' }}
    >
      {hasBg ? (
        <>
          {/* Full hero image — rendered at its natural aspect ratio so it
              is never cropped. Baked-in branding / feature strips stay
              fully readable at any viewport width (the hero simply scales
              taller as the screen widens instead of cutting top + bottom). */}
          {hasMobileBg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mobileBackgroundImage}
              alt=""
              className="block h-auto w-full sm:hidden"
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImage}
            alt=""
            className={`block h-auto w-full ${hasMobileBg ? 'hidden sm:block' : ''}`}
          />
          {hasCopy ? <div className="absolute inset-0 bg-black/15" /> : null}
        </>
      ) : (
        <div className="min-h-[500px] w-full md:min-h-[580px]" />
      )}
      {hasCopy ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
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
        </div>
      ) : null}
    </section>
  );
}
