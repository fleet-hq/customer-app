import type { StepItem } from '@/services/companyContentServices';
import { Dyn } from '@/components/i18n/Dyn';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface StepsT2Props {
  eyebrow?: string;
  title: string;
  items: StepItem[];
}

/** "How it works" — an ordered sequence, so the numbering carries real
 *  meaning (step 1 precedes step 2) rather than decorating a flat list. */
export function StepsT2({ eyebrow, title, items }: StepsT2Props) {
  if (items.length === 0) return null;

  return (
    <section className={`${styles.section} ${styles.steps}`} id="how">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          {eyebrow ? (
            <p className={styles.eyebrow}>
              <Dyn>{eyebrow}</Dyn>
            </p>
          ) : null}
          <h2>
            <Dyn>{title}</Dyn>
          </h2>
        </Reveal>
        <ol className={styles.grid}>
          {items.map((step, i) => (
            <Reveal as="li" className={styles.step} key={i} index={i}>
              <span className={styles.snum}>{String(i + 1).padStart(2, '0')}</span>
              <h3>
                <Dyn>{step.title}</Dyn>
              </h3>
              <p>
                <Dyn>{step.description}</Dyn>
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
