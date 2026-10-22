'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useIsT2 } from '@/lib/use-is-t2';
import { cn } from '@/lib/utils';

export function SecondaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const isT2 = useIsT2();
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-[10px] border py-2.5 text-[12.5px] font-medium',
        isT2 ? 'border-[var(--line-strong)] text-[var(--text)] hover:bg-[var(--paper)]' : 'border-line text-ink hover:bg-subtle',
        className,
      )}
    />
  );
}
