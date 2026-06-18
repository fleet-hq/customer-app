'use client';

import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';

export interface CarouselHandle {
  scroll: (dir: -1 | 1) => void;
}

interface CarouselProps {
  children: ReactNode;
  className?: string;
  ref?: Ref<CarouselHandle>;
}

export function Carousel({ children, className, ref }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scroll: (dir) => {
      const el = trackRef.current;
      if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 600), behavior: 'smooth' });
    },
  }));

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let suppressClick = false;
    const pageX = (e: MouseEvent | TouchEvent) => ('touches' in e ? e.touches[0].pageX : e.pageX);
    const onDown = (e: MouseEvent | TouchEvent) => {
      down = true;
      startX = pageX(e);
      startScroll = el.scrollLeft;
      el.classList.add('dragging');
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!down) return;
      const dx = pageX(e) - startX;
      if (Math.abs(dx) > 5) suppressClick = true;
      el.scrollLeft = startScroll - dx;
      if ('touches' in e && e.cancelable) e.preventDefault();
    };
    const onUp = () => {
      down = false;
      el.classList.remove('dragging');
    };
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      }
    };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onUp);
    el.addEventListener('click', onClick, true);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onUp);
      el.removeEventListener('click', onClick, true);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className={cn(
        'flex cursor-grab overflow-x-auto pb-[6px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CarouselArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-[10px]">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous"
        className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-line bg-white text-ink"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next"
        className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-line bg-white text-ink"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
