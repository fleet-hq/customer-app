'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Info } from '@/components/ui/icons';

const inputBase =
  'h-[46px] w-full rounded-[10px] border bg-white px-[14px] text-sm outline-none transition-colors focus:border-primary';

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  function TextInput({ className, error, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(inputBase, error ? 'border-danger' : 'border-line', className)}
        {...props}
      />
    );
  },
);

export function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-[5px] flex items-center gap-[5px] text-[11px] text-danger">
      <Info size={12} strokeWidth={2.2} className="flex-shrink-0" />
      {children}
    </div>
  );
}

export function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-[7px] block text-xs font-medium text-label">{label}</label>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
