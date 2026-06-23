import Link from 'next/link';
import { ArrowRight } from '@/components/ui/icons';
import { paths } from '@/lib/paths';

interface CtaBandProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  /** Admin-supplied background image; overlaid with the brand gradient
   *  so contrast is preserved no matter what the operator uploads. */
  backgroundImage?: string;
}

export function CtaBand({ eyebrow, title, description, ctaLabel, backgroundImage }: CtaBandProps) {
  // Image stays the visual focus — just a very subtle dark wash on
  // top so the white copy stays legible on bright photos. The
  // tenant's image is the bg, not the brand color or a flat panel.
  const bg = backgroundImage
    ? `linear-gradient(rgba(0,0,0,0.32), rgba(0,0,0,0.32)), url('${backgroundImage}')`
    : 'rgb(238,239,243)';
  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-6 pt-[24px] pb-[76px]">
      <div
        className="relative overflow-hidden rounded-[22px] bg-cover bg-center px-[32px] py-[64px] text-center"
        style={{ background: bg }}
      >
        <div className="relative mx-auto max-w-[600px]">
          <div className="mb-[14px] text-[12px] font-semibold tracking-[0.08em] text-white/80 uppercase">{eyebrow}</div>
          <h2 className="m-0 mb-[14px] text-[30px] leading-[1.18] font-semibold tracking-[-0.02em] text-white">{title}</h2>
          <p className="m-0 mb-[28px] text-[13px] leading-[1.6] text-white/85">{description}</p>
          <Link
            href={paths.fleet}
            className="inline-flex items-center gap-[9px] rounded-[9px] bg-primary px-[34px] py-[14px] text-[15px] font-semibold text-white"
          >
            {ctaLabel}
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
