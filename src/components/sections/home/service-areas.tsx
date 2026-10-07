import Link from 'next/link';
import { Dyn } from '@/components/i18n/Dyn';
import { MapPin } from '@/components/ui/icons';

interface AreaLink {
  label?: string;
  href?: string;
}

interface ServiceAreasProps {
  eyebrow: string;
  title: string;
  description: string;
  items: AreaLink[];
  ctaLabel?: string;
  ctaHref?: string;
}

/** Where the tenant operates. Areas that have their own landing page
 *  link to it; the rest render as plain text, so an operator can list a
 *  place before there is a page for it. */
export function ServiceAreas({
  eyebrow,
  title,
  description,
  items,
  ctaLabel,
  ctaHref,
}: ServiceAreasProps) {
  const areas = items.filter((a) => a.label?.trim());
  if (!title && !description && areas.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1120px] px-6 pt-[56px] pb-[32px]">
      <div className="mx-auto max-w-[640px] text-center">
        {eyebrow ? (
          <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">
            <Dyn>{eyebrow}</Dyn>
          </div>
        ) : null}
        {title ? (
          <h2 className="m-0 mb-[18px] text-[26px] leading-[1.25] font-semibold tracking-[-0.015em] text-ink">
            <Dyn>{title}</Dyn>
          </h2>
        ) : null}
        {description ? (
          <p className="m-0 mx-auto max-w-[520px] text-[12.5px] leading-[1.75] text-muted">
            <Dyn>{description}</Dyn>
          </p>
        ) : null}
      </div>

      {areas.length > 0 ? (
        <ul className="mt-[28px] flex list-none flex-wrap justify-center gap-[10px] p-0">
          {areas.map((area, i) => {
            const content = (
              <>
                <MapPin size={14} className="flex-shrink-0 text-primary" />
                <Dyn>{area.label ?? ''}</Dyn>
              </>
            );
            return (
              <li key={`${area.label}-${i}`}>
                {area.href ? (
                  <Link
                    href={area.href}
                    className="inline-flex items-center gap-[7px] rounded-full border border-card-border bg-white px-[14px] py-[8px] text-[12.5px] text-ink transition-colors hover:border-primary"
                  >
                    {content}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-[7px] rounded-full border border-card-border bg-subtle px-[14px] py-[8px] text-[12.5px] text-muted">
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {ctaLabel && ctaHref ? (
        <div className="mt-[28px] text-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center rounded-[9px] bg-primary px-[22px] py-3 text-sm font-semibold text-white"
          >
            <Dyn>{ctaLabel}</Dyn>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
