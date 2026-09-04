import Link from 'next/link';
import { ArrowRight } from '@/components/ui/icons';

interface BrandCtaProps {
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundImage?: string;
}

export function BrandCta({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  backgroundImage,
}: BrandCtaProps) {
  return (
    <div
      className={
        'relative overflow-hidden rounded-[22px] px-[32px] py-[48px] text-center bg-cover bg-center bg-no-repeat sm:py-[60px] ' +
        (backgroundImage ? '' : 'bg-secondary')
      }
      style={backgroundImage ? { backgroundImage: `url('${backgroundImage}')` } : undefined}
    >
      {backgroundImage ? (
        <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden="true" />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, var(--color-primary) 55%, transparent) 0%, transparent 55%)',
          }}
        />
      )}
      <div className="relative mx-auto max-w-[620px]">
        {eyebrow ? (
          <div className="mb-[14px] text-[12px] font-semibold tracking-[0.08em] text-white/75 uppercase">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="m-0 mb-[14px] font-manrope text-[27px] leading-[1.15] font-bold tracking-[-0.02em] text-white sm:text-[32px]">
          {title}
        </h2>
        {description ? (
          <p className="m-0 mb-[28px] text-[14.5px] leading-[1.65] text-white/85">{description}</p>
        ) : (
          <div className="mb-[28px]" />
        )}
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-[9px] rounded-full bg-white px-[30px] py-[14px] text-[15px] font-semibold text-ink transition-transform hover:-translate-y-[1px]"
        >
          {ctaLabel}
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}
