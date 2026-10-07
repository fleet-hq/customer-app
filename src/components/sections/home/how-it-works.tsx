import { Dyn } from '@/components/i18n/Dyn';

interface StepItem {
  title?: string;
  description?: string;
}

interface HowItWorksProps {
  eyebrow: string;
  title: string;
  items: StepItem[];
}

/** The booking process as a numbered sequence. Template 2 already had
 *  this; template 1 had no way to show the steps an operator had
 *  already filled in on the Steps tab. */
export function HowItWorks({ eyebrow, title, items }: HowItWorksProps) {
  const steps = items.filter((s) => s.title?.trim() || s.description?.trim());
  if (steps.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1120px] px-6 pt-[56px] pb-[32px]">
      <div className="mx-auto mb-[36px] max-w-[640px] text-center">
        {eyebrow ? (
          <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">
            <Dyn>{eyebrow}</Dyn>
          </div>
        ) : null}
        {title ? (
          <h2 className="m-0 text-[26px] leading-[1.25] font-semibold tracking-[-0.015em] text-ink">
            <Dyn>{title}</Dyn>
          </h2>
        ) : null}
      </div>

      <ol className="grid list-none grid-cols-1 gap-x-[40px] gap-y-[32px] p-0 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <li key={`${step.title}-${i}`} className="flex gap-[14px]">
            <span
              aria-hidden
              className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              {step.title ? (
                <h3 className="mb-[6px] text-[15px] font-semibold text-ink-2">
                  <Dyn>{step.title}</Dyn>
                </h3>
              ) : null}
              {step.description ? (
                <p className="text-[12.5px] leading-[1.65] font-light text-muted">
                  <Dyn>{step.description}</Dyn>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
