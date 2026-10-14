'use client';

import { useState } from 'react';
import type { FaqItem } from '@/services/companyContentServices';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

interface FaqT2Props {
  eyebrow?: string;
  title: string;
  items: FaqItem[];
  /** Rendered within an article column rather than as a full-bleed
   *  section. */
  inline?: boolean;
}

export function FaqT2({ eyebrow, title, items, inline = false }: FaqT2Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Inside an article the page is already a reading column, so the
  // two-column split that works full-bleed on the home page leaves the
  // questions in a sliver. Inline stacks the heading above the list and
  // lets it use the whole column.
  return (
    <section
      className={`${inline ? styles.faqInline : styles.section} ${styles.faq}`}
      id="faqs"
    >
      <div className={inline ? undefined : styles.container}>
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
