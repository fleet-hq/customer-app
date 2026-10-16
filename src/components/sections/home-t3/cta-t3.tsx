import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { paths } from '@/lib/paths';

interface CtaT3Props {
  eyebrow?: string;
  title?: string;
  buttonLabel?: string;
  /** Second action beside the primary one. Rendered only when the
   *  tenant has an application form configured, so a company without
   *  one never shows a button that leads nowhere. */
  applyLabel?: string;
  applyHref?: string;
}

export function CtaT3({ eyebrow, title, buttonLabel, applyLabel, applyHref }: CtaT3Props) {
  if (!title && !eyebrow) return null;
  return (
    <section className="cta" id="visit">
      <div className="wrap">
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
        <div className="cta-actions">
          <Link className="btn" href={paths.fleet}>
            <Dyn>{buttonLabel || 'Reserve Your Car'}</Dyn> <span className="chev">›</span>
          </Link>
          {applyHref ? (
            <Link className="btn ghost" href={applyHref}>
              <Dyn>{applyLabel || 'Apply now'}</Dyn> <span className="chev">›</span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
