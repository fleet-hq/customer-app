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
  return (
    <section
      className="relative flex min-h-[500px] flex-col items-center justify-center px-6 pt-[100px] pb-[135px] text-center md:min-h-[580px] md:pt-[124px] md:pb-[184px]"
      style={hasBg ? undefined : { backgroundColor: 'var(--color-secondary)' }}
    >
      {hasBg ? (
        <>
          {hasMobileBg ? (
            <div
              className="absolute inset-0 bg-cover sm:hidden"
              style={{ backgroundImage: `url('${mobileBackgroundImage}')`, backgroundPosition: 'center 42%' }}
            />
          ) : null}
          <div
            className={`absolute inset-0 bg-cover ${hasMobileBg ? 'hidden sm:block' : ''}`}
            style={{ backgroundImage: `url('${backgroundImage}')`, backgroundPosition: 'center 42%' }}
          />
          <div className="absolute inset-0 bg-black/15" />
        </>
      ) : null}
      <div className="relative z-10 flex flex-col items-center">
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
          <p className="mt-[20px] max-w-[540px] text-[13px] leading-[1.6] font-normal text-white/85">{subheading}</p>
        ) : null}
      </div>
    </section>
  );
}
