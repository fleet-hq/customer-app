import Image from 'next/image';
import { Dyn } from '@/components/i18n/Dyn';

interface WhyItem {
  title?: string;
  description?: string;
}

interface WhyT3Props {
  eyebrow?: string;
  title?: string;
  items: WhyItem[];
  image?: string | null;
  badgeValue?: string;
  badgeLabel?: string;
}

/** Numbered reasons beside a tall image. The numbers come from
 *  position, not the operator — renumbering after a reorder is not
 *  something anyone should have to remember. */
export function WhyT3({ eyebrow, title, items, image, badgeValue, badgeLabel }: WhyT3Props) {
  if (items.length === 0 && !title) return null;
  return (
    <>
      <section className="dark" id="why">
        <div className="wrap rule">
          <i className="x tl" />
          <i className="x tr" />
          <div className="why-grid">
            {image ? (
              <div className="why-img">
                <Image className="img" src={image} alt="" width={720} height={900} loading="lazy" unoptimized />
                {badgeValue || badgeLabel ? (
                  <div className="badge">
                    <b>
                      <Dyn>{badgeValue ?? ''}</Dyn>
                    </b>
                    <span>
                      <Dyn>{badgeLabel ?? ''}</Dyn>
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div>
              <div className="sec-head" style={{ display: 'block' }}>
                {eyebrow ? (
                  <div className="eyebrow">
                    <Dyn>{eyebrow}</Dyn>
                  </div>
                ) : null}
                {title ? (
                  <h2>
                    <Dyn>{title}</Dyn>
                  </h2>
                ) : null}
              </div>
              <div className="why-list">
                {items.map((item, i) => (
                  <div className="why-item" key={i}>
                    <div className="n">{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      {item.title ? (
                        <h3>
                          <Dyn>{item.title}</Dyn>
                        </h3>
                      ) : null}
                      {item.description ? (
                        <p>
                          <Dyn>{item.description}</Dyn>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="gap dark">
        <div className="wrap rule" />
      </div>
    </>
  );
}
