import Link from 'next/link';
import { paths } from '@/lib/paths';

interface WhyChooseProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  image: string;
}

export function WhyChoose({ eyebrow, title, description, ctaLabel, image }: WhyChooseProps) {
  return (
    <section id="about" className="mx-auto max-w-[1200px] px-6 py-[64px]">
      <div className="grid grid-cols-1 items-center gap-x-[72px] gap-y-[56px] lg:grid-cols-2">
        <div>
          <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">{eyebrow}</div>
          <h2 className="m-0 mb-[18px] text-[26px] leading-[1.25] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
          <p className="m-0 max-w-[480px] text-[12.5px] leading-[1.75] text-muted">{description}</p>
          <Link
            href={paths.fleet}
            className="mt-[28px] inline-flex items-center gap-[7px] text-[14px] font-semibold text-secondary"
          >
            {ctaLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <div
          className="h-[400px] rounded-[18px] bg-cover bg-center"
          style={{ backgroundImage: `url('${image}')` }}
        />
      </div>
    </section>
  );
}
