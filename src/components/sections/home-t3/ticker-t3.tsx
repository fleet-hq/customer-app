import { Dyn } from '@/components/i18n/Dyn';

/** The scrolling band of places served. The raw template repeated its
 *  list twice so the marquee loops seamlessly; that duplication is
 *  done here rather than asked of the operator. */
export function TickerT3({ areas, label }: { areas: string[]; label?: string }) {
  if (areas.length === 0) return null;
  const loop = [...areas, ...areas];
  return (
    <div className="ticker" role="region" aria-label={label || 'Areas we serve'}>
      <div className="ticker-in">
        {loop.map((area, i) => (
          <span key={`${area}-${i}`} aria-hidden={i >= areas.length}>
            <Dyn>{area}</Dyn>
          </span>
        ))}
      </div>
    </div>
  );
}
