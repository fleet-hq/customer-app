import Link from 'next/link';
import { paths } from '@/lib/paths';

interface PromoBannerProps {
  badge: string;
  text: string;
  ctaLabel: string;
  /** ``info`` swaps the brand-primary accent for the muted neutral
   *  treatment we use for the auto-derived multi-day discount line. */
  variant?: 'promo' | 'info';
}

export function PromoBanner({ badge, text, ctaLabel, variant = 'promo' }: PromoBannerProps) {
  const isInfo = variant === 'info';
  const wrapperClass = isInfo
    ? 'mt-[14px] flex flex-wrap items-center gap-x-[14px] gap-y-2 rounded-[10px] border border-hairline bg-tile px-[18px] py-[12px]'
    : 'mt-[14px] flex flex-wrap items-center gap-x-[14px] gap-y-2 rounded-[10px] border border-primary-border bg-primary-soft px-[18px] py-[12px]';
  const badgeClass = isInfo
    ? 'rounded-[7px] bg-secondary px-[11px] py-[5px] text-[12px] font-semibold text-white'
    : 'rounded-[7px] bg-primary px-[11px] py-[5px] text-[12px] font-semibold text-white';

  return (
    <div className={wrapperClass}>
      {badge ? <span className={badgeClass}>{badge}</span> : null}
      <span className="flex-1 text-[14px] font-medium text-secondary">{text}</span>
      {ctaLabel ? (
        <Link href={paths.fleet} className="text-[13px] font-semibold whitespace-nowrap text-secondary">
          {ctaLabel} →
        </Link>
      ) : null}
    </div>
  );
}
