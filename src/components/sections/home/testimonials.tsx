'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Star } from '@/components/ui/icons';

interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

interface TestimonialsProps {
  eyebrow: string;
  title: string;
  items: TestimonialItem[];
}

function Stars() {
  return (
    <div className="inline-flex gap-[2px] text-star">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={16} />
      ))}
    </div>
  );
}

function TestimonialCard({ t, onOpen }: { t: TestimonialItem; onOpen: (t: TestimonialItem) => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollHeight - el.clientHeight > 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [t.quote]);

  return (
    <div className="flex h-full flex-col rounded-[16px] border border-card-border bg-white px-[26px] py-[28px] transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="mb-[16px]">
        <Stars />
      </div>
      <p
        ref={ref}
        className="m-0 line-clamp-6 text-[15px] leading-[1.65] text-label"
      >
        &ldquo;{t.quote}&rdquo;
      </p>
      {truncated ? (
        <button
          type="button"
          onClick={() => onOpen(t)}
          className="mt-[10px] self-start text-[13px] font-semibold text-primary hover:underline"
        >
          Read more
        </button>
      ) : null}
      <div className="mt-auto flex items-center gap-[12px] border-t border-hairline pt-[24px]">
        <span className="inline-flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-[14px] font-semibold text-primary">
          {t.initials}
        </span>
        <div>
          <div className="text-[14px] font-semibold text-ink">{t.name}</div>
          <div className="mt-[1px] text-[12.5px] text-faint">{t.role}</div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials({ eyebrow, title, items }: TestimonialsProps) {
  const [active, setActive] = useState<TestimonialItem | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-[72px]">
      <div className="mb-[44px] text-center">
        <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">{eyebrow}</div>
        <h2 className="m-0 text-[23px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <TestimonialCard key={t.name} t={t} onOpen={setActive} />
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setActive(null)} aria-hidden="true" />
          <div className="relative z-10 max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-[18px] bg-white px-[28px] py-[30px] sm:px-[34px] sm:py-[36px]">
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute right-[16px] top-[16px] flex h-[30px] w-[30px] items-center justify-center rounded-full text-[20px] leading-none text-faint hover:bg-subtle hover:text-ink"
            >
              &times;
            </button>
            <div className="mb-[16px]">
              <Stars />
            </div>
            <p className="m-0 text-[15.5px] leading-[1.7] text-label">&ldquo;{active.quote}&rdquo;</p>
            <div className="mt-[24px] flex items-center gap-[12px] border-t border-hairline pt-[20px]">
              <span className="inline-flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-[14px] font-semibold text-primary">
                {active.initials}
              </span>
              <div>
                <div className="text-[14px] font-semibold text-ink">{active.name}</div>
                <div className="mt-[1px] text-[12.5px] text-faint">{active.role}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
