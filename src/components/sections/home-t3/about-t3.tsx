import { Dyn } from '@/components/i18n/Dyn';

interface AboutT3Props {
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function AboutT3({ eyebrow, title, description }: AboutT3Props) {
  if (!eyebrow && !title && !description) return null;
  return (
    <>
      <section id="about">
        <div className="wrap rule">
          <i className="x tl" />
          <i className="x tr" />
          <div className="about-grid">
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
            {description ? (
              <p>
                <Dyn>{description}</Dyn>
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <div className="gap">
        <div className="wrap rule" />
      </div>
    </>
  );
}
