import Link from 'next/link';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface CtaT2Props {
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel: string;
}

export function CtaT2({ eyebrow, title, description, ctaLabel }: CtaT2Props) {
  return (
    <section className={styles.cta}>
      <Reveal className={styles.container}>
        {eyebrow ? (
          <p className={styles.eyebrow}>
            <Dyn>{eyebrow}</Dyn>
          </p>
        ) : null}
        <h2>
          <Dyn>{title}</Dyn>
        </h2>
        {description ? (
          <p>
            <Dyn>{description}</Dyn>
          </p>
        ) : null}
        <div className={styles.ctaActions}>
          <Link href={paths.fleet} className={`${styles.btn} ${styles.btnBrass}`}>
            <Dyn>{ctaLabel}</Dyn>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
