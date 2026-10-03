import { Dyn } from '@/components/i18n/Dyn';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface PromoBandT2Props {
  badge?: string;
  text: string;
}

/** Renders `sections.promo` as the mockup's navy band, including its
 *  wave cut-out along the bottom edge. */
export function PromoBandT2({ badge, text }: PromoBandT2Props) {
  return (
    <section className={styles.band}>
      <div className={styles.container}>
        <Reveal className={styles.bandItem}>
          {badge ? (
            <h3>
              <Dyn>{badge}</Dyn>
            </h3>
          ) : null}
          <p>
            <Dyn>{text}</Dyn>
          </p>
        </Reveal>
      </div>
      <div className={styles.bandWave} aria-hidden="true">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0 70 q100 -44 200 0 t200 0 t200 0 t200 0 t200 0 t200 0 V120 H0 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}
