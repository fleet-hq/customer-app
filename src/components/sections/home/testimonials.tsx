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

export function Testimonials({ eyebrow, title, items }: TestimonialsProps) {
  // Hide the whole section until an admin adds at least one review —
  // an empty grid looks broken on a marketing page.
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-[72px]">
      <div className="mb-[44px] text-center">
        <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">{eyebrow}</div>
        <h2 className="m-0 text-[23px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <div
            key={t.name}
            className="flex flex-col rounded-[16px] border border-card-border bg-white px-[26px] py-[28px] transition-shadow hover:shadow-[var(--shadow-card)]"
          >
            <div className="mb-[16px] inline-flex gap-[2px] text-star">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={16} />
              ))}
            </div>
            <p className="m-0 mb-[24px] flex-1 text-[15px] leading-[1.65] text-label">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center gap-[12px] border-t border-hairline pt-[20px]">
              <span className="inline-flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-[14px] font-semibold text-primary">
                {t.initials}
              </span>
              <div>
                <div className="text-[14px] font-semibold text-ink">{t.name}</div>
                <div className="mt-[1px] text-[12.5px] text-faint">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
