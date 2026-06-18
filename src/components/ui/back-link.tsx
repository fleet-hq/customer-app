import Link from 'next/link';
import { ChevronLeft } from '@/components/ui/icons';

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-[6px] text-[13.5px] font-semibold text-primary no-underline"
    >
      <ChevronLeft size={16} /> {children}
    </Link>
  );
}
