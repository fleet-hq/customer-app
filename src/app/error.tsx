'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Segment error:', error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-6 py-[96px] text-center">
      <div className="mb-[14px] text-[12px] font-semibold tracking-[0.08em] text-danger uppercase">
        Something went wrong
      </div>
      <h1 className="m-0 mb-[14px] text-[30px] leading-[1.18] font-semibold tracking-[-0.02em] text-ink">
        We hit an unexpected error
      </h1>
      <p className="m-0 mb-[28px] text-[13px] leading-[1.6] text-muted">
        Sorry for the inconvenience. You can try again — if it keeps happening, please refresh the page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-[6px] rounded-[10px] bg-primary px-[18px] py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Try again
      </button>
    </section>
  );
}
