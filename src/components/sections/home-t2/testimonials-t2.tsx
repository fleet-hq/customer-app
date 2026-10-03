import type { TestimonialItem } from '@/services/companyContentServices';
import { Dyn } from '@/components/i18n/Dyn';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface TestimonialsT2Props {
  eyebrow?: string;
  title: string;
  items: TestimonialItem[];
}

/** Stars are text glyphs, not icons — the template-2 reset sets
 *  `svg { display: block }`, which stacked five icon components into a
 *  vertical column. Glyphs also let a 4-star review render as
 *  ★★★★☆ without a second asset. */
function stars(rating?: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating ?? 5)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

export function TestimonialsT2({ eyebrow, title, items }: TestimonialsT2Props) {
  return (
    <section className={styles.section} aria-label="Customer reviews">
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
        <div className={styles.quotesGrid}>
          {items.map((item, i) => (
            <Reveal as="figure" className={styles.quote} key={i} index={i}>
              <div className={styles.stars} aria-label={`${Math.round(item.rating ?? 5)} out of 5 stars`}>
                {stars(item.rating)}
              </div>
              <p>
                <Dyn>{item.quote}</Dyn>
              </p>
              <figcaption className={styles.quoteAuthor}>
                <b>{item.name}</b>
                {item.role ? <Dyn>{item.role}</Dyn> : null}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
