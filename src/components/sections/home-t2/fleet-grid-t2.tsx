'use client';

import Link from 'next/link';
import { paths } from '@/lib/paths';
import { useFleets } from '@/hooks';
import { Dyn } from '@/components/i18n/Dyn';
import { CarCardT2 } from '@/components/fleet/car-card-t2';
import { Reveal } from './reveal';
import styles from '@/styles/template-2.module.css';

interface FleetGridT2Props {
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel: string;
}

/** Real fleet inventory — reuses `useFleets`, the exact hook the
 *  template-1 FleetCarousel already uses. No demo Camry/Rogue/Tesla
 *  cards: an empty fleet renders nothing (see home-client-t2). */
export function FleetGridT2({ eyebrow, title, description, ctaLabel }: FleetGridT2Props) {
  const { data } = useFleets(1, '', 8);
  const vehicles = data?.results ?? [];
  if (vehicles.length === 0) return null;

  return (
    <section className={`${styles.section} ${styles.fleet}`} id="fleet">
      <div className={styles.container}>
        <Reveal className={styles.fleetTop}>
          <div className={styles.sectionHead}>
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
          </div>
          <Link href={paths.fleet} className={styles.linkMore}>
            <Dyn>{ctaLabel}</Dyn>
          </Link>
        </Reveal>

        <div className={styles.fleetGrid}>
          {vehicles.map((v, i) => (
            <Reveal key={v.id} index={i} className={styles.revealCard}>
              {/* No dates are picked on the home page, so no discount
                  tier actually applies yet — advertising the highest
                  configured tier here would show a saving the customer
                  isn't getting. */}
              <CarCardT2 vehicle={v} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
