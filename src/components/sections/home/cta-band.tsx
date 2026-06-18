import Link from 'next/link';
import { ArrowRight } from '@/components/ui/icons';
import { paths } from '@/lib/paths';

interface CtaBandProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export function CtaBand({ eyebrow, title, description, ctaLabel }: CtaBandProps) {
  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-6 pt-[24px] pb-[76px]">
      <div
        className="relative overflow-hidden rounded-[22px] px-[32px] py-[64px] text-center"
        style={{
          background:
            'radial-gradient(120% 140% at 85% 15%, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 60%, var(--color-secondary)) 42%, var(--color-secondary) 100%)',
        }}
      >
        <div className="absolute -top-[80px] -right-[60px] h-[260px] w-[260px] rounded-full bg-white/[0.07]" />
        <div className="absolute -bottom-[110px] -left-[50px] h-[240px] w-[240px] rounded-full bg-white/[0.06]" />
        <div className="relative mx-auto max-w-[600px]">
          <div className="mb-[14px] text-[12px] font-semibold tracking-[0.08em] text-white/80 uppercase">{eyebrow}</div>
          <h2 className="m-0 mb-[14px] text-[30px] leading-[1.18] font-semibold tracking-[-0.02em] text-white">{title}</h2>
          <p className="m-0 mb-[28px] text-[13px] leading-[1.6] text-white/85">{description}</p>
          <Link
            href={paths.fleet}
            className="inline-flex items-center gap-[9px] rounded-[9px] bg-white px-[34px] py-[14px] text-[15px] font-semibold text-secondary"
          >
            {ctaLabel}
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
