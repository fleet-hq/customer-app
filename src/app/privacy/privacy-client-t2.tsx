'use client';

import { withCompany } from '@/lib/tenant';
import { useTenant } from '@/lib/tenant-context';
import { Dyn } from '@/components/i18n/Dyn';
import { PRIVACY_SECTIONS, PRIVACY_INTRO } from './privacy-content';
import styles from '@/styles/template-2.module.css';

export default function PrivacyClientT2() {
  const tenant = useTenant();
  const intro = withCompany(PRIVACY_INTRO, tenant.name);
  const sections = PRIVACY_SECTIONS.map((sec) => ({
    heading: sec.heading,
    paras: sec.paras.map((p) => withCompany(p, tenant.name)),
  }));

  return (
    <div className={styles.container}>
      <div className={styles.articleHead}>
        <h1>
          <Dyn>Privacy Policy</Dyn>
        </h1>
        <p className={styles.articleIntro}>{intro}</p>
      </div>

      <div className={styles.articleBody}>
        {sections.map((sec) => (
          <div key={sec.heading} className={styles.articleSection}>
            <h2>{sec.heading}</h2>
            <div className={styles.articleParas}>
              {sec.paras.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
