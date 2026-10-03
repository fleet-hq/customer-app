'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils';
import { useTenant } from '@/lib/tenant-context';

interface SignaturePadProps {
  label?: string;
  onSignatureChange?: (signature: string | null) => void;
  initialSignature?: string | null;
  height?: number;
}

export function SignaturePad({
  label,
  onSignatureChange,
  initialSignature = null,
  height = 120,
}: SignaturePadProps) {
  const tenant = useTenant();
  const isT2 = tenant.websiteTemplate === 'template_2';
  const canvasRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSignature, setHasSignature] = useState<boolean>(!!initialSignature);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const appliedSignatureRef = useRef<string | null>(null);
  useEffect(() => {
    if (!canvasRef.current || !containerWidth) return;
    if (appliedSignatureRef.current === initialSignature) return;
    appliedSignatureRef.current = initialSignature;
    canvasRef.current.clear();
    if (initialSignature) {
      canvasRef.current.fromDataURL(initialSignature, {
        width: containerWidth,
        height,
      });
      setHasSignature(true);
    } else {
      setHasSignature(false);
    }
  }, [initialSignature, containerWidth, height]);

  const handleEnd = () => {
    const c = canvasRef.current;
    if (!c) return;
    if (c.isEmpty()) {
      setHasSignature(false);
      onSignatureChange?.(null);
      return;
    }
    const dataUrl = c.toDataURL('image/png');
    setHasSignature(true);
    onSignatureChange?.(dataUrl);
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setHasSignature(false);
    onSignatureChange?.(null);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <span className={cn('text-[12px] font-bold', isT2 ? 'text-[var(--text)]' : 'text-ink')}>{label}</span>
      )}
      {/* The drawing surface itself stays white in both templates: react-signature-canvas
          draws in black ink, so on a dark T2 card the strokes would be invisible while
          signing. Only the surrounding chrome (border, label, clear button) is themed. */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full overflow-hidden border border-dashed bg-white',
          isT2 ? 'rounded-[3px] border-[var(--brass)]/50' : 'rounded-[10px] border-primary/50',
        )}
        style={{ height }}
      >
        {containerWidth > 0 && (
          <SignatureCanvas
            ref={canvasRef}
            onEnd={handleEnd}
            canvasProps={{
              width: containerWidth,
              height,
              className: 'block cursor-crosshair touch-none',
            }}
          />
        )}
        {!hasSignature && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-caveat text-[20px] leading-none text-faint/60">
            Sign here
          </span>
        )}
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasSignature}
          className={cn(
            'rounded-md border px-3 py-1 text-[11.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent',
            isT2
              ? 'border-[var(--brass)]/40 text-[var(--brass)] hover:bg-[color-mix(in_srgb,var(--brass)_10%,transparent)] disabled:border-[var(--line)] disabled:text-[var(--text-muted)]'
              : 'border-primary/40 text-primary hover:bg-primary-soft disabled:border-line disabled:text-faint',
          )}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
