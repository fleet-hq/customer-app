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
  /** Optional. Present turns the CTA into two columns; absent leaves
   *  the centred block untouched. */
  image?: string | null;
  imageAlt?: string;
}

export function CtaT2({
  eyebrow,
  title,
  description,
  ctaLabel,
  image,
  imageAlt,
}: CtaT2Props) {
  const body = (
    <>
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
    </>
  );

  if (!image) {
    return (
      <section className={styles.cta}>
        <Reveal className={styles.container}>{body}</Reveal>
      </section>
    );
  }

  return (
    <section className={`${styles.cta} ${styles.ctaWithImage}`}>
      <Reveal className={styles.container}>
        <div className={styles.ctaCopy}>{body}</div>
        <div className={styles.ctaMedia}>
          {/* Operator-supplied; next/image would need the host allow-listed
              per tenant, which the other section images avoid the same way. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={imageAlt || ''} loading="lazy" />
        </div>
      </Reveal>
    </section>
  );
}
