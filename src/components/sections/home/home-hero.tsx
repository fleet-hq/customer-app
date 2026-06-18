import { MapPin } from '@/components/ui/icons';

interface HomeHeroProps {
  pill: string;
  headingLines: string[];
  subheading: string;
}

export function HomeHero({ pill, headingLines, subheading }: HomeHeroProps) {
  return (
    <section className="relative flex min-h-[440px] flex-col items-center justify-center px-6 pt-[88px] pb-[120px] text-center md:pt-[104px] md:pb-[168px]">
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url('/images/home-hero.jpg')`, backgroundPosition: 'center 42%' }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-[14px] inline-flex items-center gap-[6px] rounded-full border border-white/20 bg-white/10 py-[3px] pr-[11px] pl-[9px] backdrop-blur-sm">
          <MapPin size={12} strokeWidth={2} className="text-primary" />
          <span className="text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap text-white/90 uppercase">
            {pill}
          </span>
        </div>
        <h1 className="m-0 max-w-[1000px] text-[26px] leading-[1.16] font-semibold tracking-[-0.024em] text-white sm:text-[32px] md:text-[36px]">
          {headingLines.map((line) => (
            <span key={line} className="block sm:whitespace-nowrap">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-[20px] max-w-[540px] text-[13px] leading-[1.6] font-normal text-white/85">{subheading}</p>
      </div>
    </section>
  );
}
