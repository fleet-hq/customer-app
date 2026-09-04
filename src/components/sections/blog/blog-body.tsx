'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

export function BlogBody({ html }: { html: string }) {
  const clean = useMemo(() => {
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
  }, [html]);

  return (
    <div
      className="blog-prose flex flex-col gap-[18px] text-[17px] leading-[1.8] text-label"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
