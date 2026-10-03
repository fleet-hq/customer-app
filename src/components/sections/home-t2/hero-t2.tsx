import Image from 'next/image';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import { SearchBarT2 } from '@/components/search/search-bar-t2';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

interface HeroT2Props {
  pill?: string;
  headingLines: string[];
  subheading?: string;
  backgroundImage?: string;
}

export function HeroT2({ pill, headingLines, subheading, backgroundImage }: HeroT2Props) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            {pill ? (
              <p className={styles.eyebrow}>
                <Dyn>{pill}</Dyn>
              </p>
            ) : null}
            <h1>
              {headingLines.map((line, i) => (
                <span key={i}>
                  <Dyn>{line}</Dyn>
                  {i < headingLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h1>
            {subheading ? (
              <p className={styles.lede}>
                <Dyn>{subheading}</Dyn>
              </p>
            ) : null}
            <div className={styles.heroActions}>
              <Link href={paths.fleet} className={`${styles.btn} ${styles.btnBrass}`}>
                <Dyn>Reserve a car</Dyn>
              </Link>
              <Link href={paths.fleet} className={`${styles.btn} ${styles.btnOnInkGhost}`}>
                <Dyn>Browse the fleet</Dyn>
              </Link>
            </div>
          </div>
          {backgroundImage ? (
            <div className={styles.heroFigure}>
              <Image src={backgroundImage} alt="" width={780} height={523} unoptimized priority />
            </div>
          ) : null}
        </div>

        {/* The mockup's twin brass curves along the hero's base — they
            sit behind the booking bar, which overlaps the hero. */}
        <div className={styles.heroWaterline} aria-hidden="true">
          <svg viewBox="0 0 1200 70" preserveAspectRatio="none">
            <path
              d="M0 40 q75 -26 150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M0 56 q75 -26 150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />
          </svg>
        </div>
      </section>

      <SearchBarT2 variant="hero" />
    </>
  );
}
