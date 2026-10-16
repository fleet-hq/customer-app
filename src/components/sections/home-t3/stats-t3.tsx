import { Dyn } from '@/components/i18n/Dyn';

interface StatItem {
  value?: string;
  label?: string;
}

export function StatsT3({ items }: { items: StatItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="dark statband">
      <div className="wrap rule">
        <div className="stats">
          {items.map((item, i) => (
            <div key={i}>
              <b>
                <Dyn>{item.value ?? ''}</Dyn>
              </b>
              <span>
                <Dyn>{item.label ?? ''}</Dyn>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
