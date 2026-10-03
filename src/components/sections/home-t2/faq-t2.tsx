'use client';

import { useState } from 'react';
import type { FaqItem } from '@/services/companyContentServices';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

interface FaqT2Props {
  eyebrow?: string;
  title: string;
  items: FaqItem[];
}

export function FaqT2({ eyebrow, title, items }: FaqT2Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`${styles.section} ${styles.faq}`} id="faqs">
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          {eyebrow ? (
            <p className={styles.eyebrow}>
              <Dyn>{eyebrow}</Dyn>
            </p>
          ) : null}
          <h2>
            <Dyn>{title}</Dyn>
          </h2>
        </div>
        <div className={styles.faqList}>
          {items.map((item, i) => {
            const open = openIndex === i;
            return (
              <div className={styles.faqItem} key={i}>
                <button
                  type="button"
                  className={`${styles.faqQ} ${open ? styles.faqQOpen : ''}`}
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <Dyn>{item.question}</Dyn>
                </button>
                <div className={`${styles.faqA} ${open ? styles.faqAOpen : ''}`}>
                  <p>
                    <Dyn>{item.answer}</Dyn>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
