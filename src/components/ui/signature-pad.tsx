'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

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

  useEffect(() => {
    if (!canvasRef.current || !containerWidth) return;
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
      {label && <span className="text-[12px] font-bold text-ink">{label}</span>}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[10px] border border-dashed border-primary/50 bg-white"
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
          className="rounded-md border border-primary/40 px-3 py-1 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:border-line disabled:text-faint disabled:hover:bg-transparent"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
