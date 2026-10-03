'use client';

import { forwardRef, useId, cloneElement, isValidElement, type ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { Info } from '@/components/ui/icons';
import { useTenant } from '@/lib/tenant-context';

const inputBase =
  'h-[46px] w-full rounded-[10px] border bg-white px-[14px] text-sm outline-none transition-colors focus:border-primary';

const inputBaseT2 =
  'h-[46px] w-full rounded-[2px] border px-[14px] text-sm outline-none transition-colors bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--brass)]';

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  function TextInput({ className, error, ...props }, ref) {
    const tenant = useTenant();
    const isT2 = tenant.websiteTemplate === 'template_2';
    return (
      <input
        ref={ref}
        className={cn(
          isT2 ? inputBaseT2 : inputBase,
          isT2
            ? error
              ? 'border-[var(--danger)]'
              : 'border-[var(--line-strong)]'
            : error
              ? 'border-danger'
              : 'border-line',
          className,
        )}
        {...props}
      />
    );
  },
);

export function FieldError({ children }: { children: React.ReactNode }) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  return (
    <div className={cn('mt-[5px] flex items-center gap-[5px] text-[11px]', isT2 ? 'text-[var(--danger)]' : 'text-danger')}>
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
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const reactId = useId();
  let control = children;
  let inputId: string | undefined;
  if (isValidElement(children)) {
    const child = children as ReactElement<{ id?: string }>;
    inputId = child.props.id ?? reactId;
    if (!child.props.id) {
      control = cloneElement(child, { id: inputId });
    }
  }

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={cn(
          'mb-[7px] block text-xs font-medium text-label',
          isT2 && 'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]',
        )}
      >
        {label}
      </label>
      {control}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
