'use client';

import DOMPurify from 'dompurify';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

/** Live-translates an HTML fragment (tags preserved by the MT provider),
 *  then renders it sanitized. Falls back to the original HTML until the
 *  translation is ready. */
export function DynHtml({ html, className }: { html?: string | null; className?: string }) {
  const { t } = useDynamicTranslation([html ?? ''], { html: true });
  const out = t(html) || '';
  return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(out) }} />;
}
