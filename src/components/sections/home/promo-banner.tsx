import Link from 'next/link';
import { paths } from '@/lib/paths';

interface PromoBannerProps {
  badge: string;
  text: string;
  ctaLabel: string;
}

export function PromoBanner({ badge, text, ctaLabel }: PromoBannerProps) {
  return (
    <div className="mt-[14px] flex flex-wrap items-center gap-x-[14px] gap-y-2 rounded-[10px] border border-primary-border bg-primary-soft px-[18px] py-[12px]">
      <span className="rounded-[7px] bg-primary px-[11px] py-[5px] text-[12px] font-semibold text-white">{badge}</span>
      <span className="flex-1 text-[14px] font-medium text-secondary">{text}</span>
      <Link href={paths.fleet} className="text-[13px] font-semibold whitespace-nowrap text-secondary">
        {ctaLabel} →
      </Link>
    </div>
  );
}
