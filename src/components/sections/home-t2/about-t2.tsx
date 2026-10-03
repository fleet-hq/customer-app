import Image from 'next/image';
import { Dyn } from '@/components/i18n/Dyn';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface AboutT2Props {
  eyebrow?: string;
  title: string;
  description: string;
  image?: string;
}

/** Template-2's "About" section — renders `sections.why_choose`,
 *  mirroring template 1's WhyChoose. */
export function AboutT2({ eyebrow, title, description, image }: AboutT2Props) {
  const paragraphs = description.split('\n').filter((p) => p.trim().length > 0);
  return (
    <section className={`${styles.section} ${styles.about}`} id="about">
      <div className={styles.container}>
        {image ? (
          <Reveal className={styles.heroFigure}>
            <Image src={image} alt="" width={700} height={500} unoptimized />
          </Reveal>
        ) : null}
        <Reveal>
          {eyebrow ? (
            <p className={styles.eyebrow}>
              <Dyn>{eyebrow}</Dyn>
            </p>
          ) : null}
          <h2>
            <Dyn>{title}</Dyn>
          </h2>
          <div className={styles.aboutBody}>
            {paragraphs.map((p, i) => (
              <p key={i}>
                <Dyn>{p}</Dyn>
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
