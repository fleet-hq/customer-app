'use client';

import { Lock, Upload } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function Dropzone({
  added,
  onClick,
  caption,
  label,
}: {
  added: boolean;
  onClick: () => void;
  caption: string;
  label?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed p-4 text-center',
        added ? 'border-primary bg-primary-soft' : 'border-dash bg-subtle-2',
      )}
    >
      <Upload size={20} className="text-primary" />
      <div className="mt-2 text-[12.5px] font-semibold text-secondary">{added ? (label ?? 'Photo added') : 'Add photo'}</div>
      <div className="mt-0.5 text-[11px] text-faint">{caption}</div>
    </div>
  );
}

export function ReassuranceStrip({ text }: { text: string }) {
  return (
    <div className="mt-5 flex items-center gap-2 rounded-[10px] border border-primary-border bg-primary-soft px-[14px] py-[11px]">
      <Lock size={15} strokeWidth={1.9} className="flex-shrink-0 text-primary" />
      <span className="text-[11.5px] leading-[1.45] text-secondary">{text}</span>
    </div>
  );
}
