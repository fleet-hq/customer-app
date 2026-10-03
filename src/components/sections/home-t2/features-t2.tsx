import { Dyn } from '@/components/i18n/Dyn';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface FeaturesT2Props {
  eyebrow?: string;
  title?: string;
  items: { title: string; description: string }[];
}

/** The mockup's numbered "why choose us" grid: the heading comes from
 *  `sections.why_choose` (it is literally the why-choose-us copy) and
 *  the cards from `sections.feature_columns`. The numbers are a
 *  catalogue of reasons rather than an ordered process, which is why
 *  this is a plain grid while how-it-works is an ordered list. */
export function FeaturesT2({ eyebrow, title, items }: FeaturesT2Props) {
  const hasHead = !!(eyebrow || title);

  return (
    <section className={`${styles.section} ${styles.features}`} style={{ paddingTop: 0 }}>
      <div className={styles.container}>
        {hasHead ? (
          <Reveal className={styles.sectionHead}>
            {eyebrow ? (
              <p className={styles.eyebrow}>
                <Dyn>{eyebrow}</Dyn>
              </p>
            ) : null}
            {title ? (
              <h2>
                <Dyn>{title}</Dyn>
              </h2>
            ) : null}
          </Reveal>
        ) : null}
        <div className={styles.grid}>
          {items.map((item, i) => (
            <Reveal className={styles.feature} key={i} index={i}>
              <span className={styles.fnum}>{String(i + 1).padStart(2, '0')}</span>
              <h3>
                <Dyn>{item.title}</Dyn>
              </h3>
              <p>
                <Dyn>{item.description}</Dyn>
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
