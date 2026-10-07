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
      <div className="mx-auto mb-[44px] max-w-[640px] text-center">
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

      <ol className="m-0 grid list-none grid-cols-1 gap-y-[30px] p-0 lg:flex lg:items-start lg:gap-x-0">
        {steps.map((step, i) => (
          <li
            key={`${step.title}-${i}`}
            className="relative flex gap-[14px] lg:flex-1 lg:flex-col lg:items-center lg:gap-0 lg:px-[12px] lg:text-center"
          >
            {i > 0 ? (
              <span
                aria-hidden
                className="absolute top-[15px] left-0 hidden h-px w-1/2 bg-line lg:block"
              />
            ) : null}
            {i < steps.length - 1 ? (
              <>
                <span
                  aria-hidden
                  className="absolute top-[15px] right-0 hidden h-px w-1/2 bg-line lg:block"
                />
                <span
                  aria-hidden
                  className="absolute top-[36px] bottom-[-30px] left-[15px] w-px -translate-x-1/2 bg-line lg:hidden"
                />
              </>
            ) : null}
            <span
              aria-hidden
              className="relative z-10 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white lg:mb-[16px]"
            >
              {i + 1}
            </span>
            <div className="min-w-0 lg:w-full">
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
