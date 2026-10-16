import { Dyn } from '@/components/i18n/Dyn';

interface StepItem {
  title?: string;
  description?: string;
}

export function StepsT3({
  eyebrow,
  title,
  items,
}: {
  eyebrow?: string;
  title?: string;
  items: StepItem[];
}) {
  if (items.length === 0) return null;
  return (
    <>
      <section id="how">
        <div className="wrap rule">
          <i className="x tl" />
          <i className="x tr" />
          <div className="sec-head sec-head-center">
            <div>
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
          </div>
          <div className="steps">
            {items.map((step, i) => (
              <div className="step" key={i}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                {step.title ? (
                  <h3>
                    <Dyn>{step.title}</Dyn>
                  </h3>
                ) : null}
                {step.description ? (
                  <p>
                    <Dyn>{step.description}</Dyn>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="gap">
        <div className="wrap rule" />
      </div>
    </>
  );
}
