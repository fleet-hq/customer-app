'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import styles from '@/styles/template-2.module.css';

interface RevealProps {
  children: ReactNode;
  /** Renders as a different element where the parent's layout needs a
   *  specific tag (grid children, <figure>, list items…). */
  as?: ElementType;
  className?: string;
  /** Staggers siblings in a grid — index * 70ms, capped so a long list
   *  never leaves the last item waiting. */
  index?: number;
}

/** Scroll-reveal wrapper ported from the template-2 mockup's
 *  IntersectionObserver script. Reveals once, then stops observing.
 *  Anything already in view on load still animates in, so the hero
 *  region doesn't look static. Honours prefers-reduced-motion by
 *  rendering visible immediately. */
export function Reveal({ children, as: Tag = 'div', className, index = 0 }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${styles.reveal} ${shown ? styles.revealIn : ''} ${className ?? ''}`}
      style={shown && index ? { transitionDelay: `${Math.min(index, 6) * 70}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
