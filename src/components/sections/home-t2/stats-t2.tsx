'use client';

import { useEffect, useRef, useState } from 'react';
import type { StatItem } from '@/services/companyContentServices';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

/** Splits "1240+" into {prefix:'', number:1240, suffix:'+', decimals:0}
 *  so the operator only ever types the finished display value and the
 *  count-up still knows what to animate. Values with no leading number
 *  ("24/7") come back as null and render verbatim. */
function parseCountable(value: string) {
  const match = /^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/.exec(value.trim());
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
  return { prefix, target: Number(digits), suffix, decimals };
}

function StatValue({ value }: { value: string }) {
  const parsed = parseCountable(value);
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(() => (parsed ? `${parsed.prefix}0${parsed.suffix}` : value));

  useEffect(() => {
    if (!parsed) return;
    const node = ref.current;
    if (!node) return;

    const format = (n: number) =>
      `${parsed.prefix}${n.toLocaleString(undefined, {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}${parsed.suffix}`;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      setDisplay(format(parsed.target));
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const duration = 1400;
        let start: number | null = null;
        const tick = (ts: number) => {
          if (start === null) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(format(parsed.target * eased));
          if (p < 1) frame = requestAnimationFrame(tick);
          else setDisplay(format(parsed.target));
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // `parsed` is derived from `value` — re-running on value change is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <b ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </b>
  );
}

export function StatsT2({ items }: { items: StatItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className={styles.stats} aria-label="Company at a glance">
      <div className={styles.container}>
        {items.map((stat, i) => (
          <div className={styles.stat} key={i}>
            <StatValue value={stat.value} />
            <span>
              <Dyn>{stat.label}</Dyn>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
