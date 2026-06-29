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
  // Image stays the visual focus, but on mobile the container is tall
  // and narrow — ``cover`` would crop the photo to its center. Switch
  // to ``contain`` on small screens so the full image stays visible,
  // and split the dark wash into its own absolute layer so the
  // gradient still spans the whole container even when the image is
  // letterboxed.
  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-6 pt-[24px] pb-[76px]">
      <div
        className={
          'relative overflow-hidden rounded-[22px] px-[32px] py-[64px] text-center bg-center bg-no-repeat ' +
          (backgroundImage ? 'bg-contain sm:bg-cover bg-[#1a1a1a]' : '')
        }
        style={
          backgroundImage
            ? { backgroundImage: `url('${backgroundImage}')` }
            : { backgroundColor: 'rgb(238,239,243)' }
        }
      >
        {backgroundImage && (
          <div className="pointer-events-none absolute inset-0 bg-black/30" aria-hidden="true" />
        )}
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
