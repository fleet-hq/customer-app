import { Dyn } from '@/components/i18n/Dyn';
import { telHref } from '@/lib/seo';

interface FaqItem {
  question?: string;
  answer?: string;
}

export function FaqT3({
  eyebrow,
  title,
  items,
  phone,
}: {
  eyebrow?: string;
  title?: string;
  items: FaqItem[];
  phone?: string;
}) {
  if (items.length === 0) return null;
  const tel = telHref(phone);
  return (
    <section id="faq">
      <div className="wrap rule">
        <i className="x tl" />
        <i className="x tr" />
        <div className="faq-grid">
          <div className="side">
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
            {tel ? (
              <a className="btn ghost" href={tel}>
                <Dyn>Call</Dyn> {phone} <span className="chev">›</span>
              </a>
            ) : null}
          </div>
          <div>
            {items.map((faq, i) => (
              <details key={i} open={i === 0}>
                <summary>
                  <Dyn>{faq.question ?? ''}</Dyn>
                  <span className="pm" />
                </summary>
                {faq.answer ? (
                  <p>
                    <Dyn>{faq.answer}</Dyn>
                  </p>
                ) : null}
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
