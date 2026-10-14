import Image from 'next/image';
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
}

export function CtaT2({ eyebrow, title, description, ctaLabel, image }: CtaT2Props) {
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
          {/* ``unoptimized`` for the same reason as the hero and about
              images: the source is an operator upload on a tenant domain
              the optimizer has no allow-list entry for. Decorative, so
              the alt stays empty — the heading beside it carries the
              meaning. */}
          <Image src={image} alt="" width={700} height={525} unoptimized />
        </div>
      </Reveal>
    </section>
  );
}
