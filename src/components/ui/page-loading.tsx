import { cn } from '@/lib/utils';

interface PageLoadingProps {
  label?: string;
  className?: string;
}

export function PageLoading({ label = 'Loading…', className }: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-full flex-1 flex-col items-center justify-center gap-4 px-6 py-32',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary"
      />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
