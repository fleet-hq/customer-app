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
  // Image rendered as-is with a soft light-gray wash overlay so the
  // copy stays legible on top of any uploaded photo. No more brand
  // gradient, no more decorative blobs.
  const bg = backgroundImage
    ? `linear-gradient(rgba(244,244,246,0.78), rgba(244,244,246,0.78)), url('${backgroundImage}')`
    : 'rgb(244,244,246)';
  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-6 pt-[24px] pb-[76px]">
      <div
        className="relative overflow-hidden rounded-[22px] bg-cover bg-center px-[32px] py-[64px] text-center"
        style={{ background: bg }}
      >
        <div className="relative mx-auto max-w-[600px]">
          <div className="mb-[14px] text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">{eyebrow}</div>
          <h2 className="m-0 mb-[14px] text-[30px] leading-[1.18] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
          <p className="m-0 mb-[28px] text-[13px] leading-[1.6] text-muted">{description}</p>
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
