import Link from 'next/link';
import { paths } from '@/lib/paths';

interface WhyChooseProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  /** ``undefined`` → no image is rendered, copy column fills the row.
   *  No bundled fallback. */
  image?: string;
}

export function WhyChoose({ eyebrow, title, description, ctaLabel, image }: WhyChooseProps) {
  return (
    <section
      id="about"
      className={`mx-auto max-w-[1200px] px-6 py-[64px] ${image ? '' : 'text-center'}`}
    >
      <div
        className={
          image
            ? 'grid grid-cols-1 items-center gap-x-[72px] gap-y-[56px] lg:grid-cols-2'
            : 'mx-auto max-w-[640px]'
        }
      >
        <div>
          {eyebrow ? (
            <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">
              {eyebrow}
            </div>
          ) : null}
          {title ? (
            <h2 className="m-0 mb-[18px] text-[26px] leading-[1.25] font-semibold tracking-[-0.015em] text-ink">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p
              className={`m-0 text-[12.5px] leading-[1.75] text-muted text-justify hyphens-auto ${image ? 'max-w-[480px]' : 'mx-auto max-w-[520px]'}`}
            >
              {description}
            </p>
          ) : null}
          {ctaLabel ? (
            <Link
              href={paths.fleet}
              className={`mt-[28px] inline-flex items-center gap-[7px] text-[14px] font-semibold text-secondary ${image ? '' : 'justify-center'}`}
            >
              {ctaLabel}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ) : null}
        </div>
        {image ? (
          <div
            className="mx-auto h-[220px] w-full max-w-[360px] rounded-[18px] bg-cover bg-center sm:h-[250px] lg:h-[280px]"
            style={{ backgroundImage: `url('${image}')` }}
          />
        ) : null}
      </div>
    </section>
  );
}
