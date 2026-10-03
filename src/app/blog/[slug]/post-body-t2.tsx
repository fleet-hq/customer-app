'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import styles from '@/styles/template-2.module.css';

/** Template-2 sibling of BlogBody — same sanitisation, restyled with
 *  the t2 long-form article typography. */
export function PostBodyT2({ html }: { html: string }) {
  const clean = useMemo(() => {
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
  }, [html]);

  return <div className={styles.postBody} dangerouslySetInnerHTML={{ __html: clean }} />;
}
