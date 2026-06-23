interface SetupInProgressProps {
  host: string;
  /** When true, drop the full-screen sizing so the block can sit
   *  inside a layout that already has header + footer rendering.
   *  ``layout.tsx`` uses the default (full-screen) for unmapped
   *  hostnames; ``app/page.tsx`` uses ``compact`` when a mapped
   *  tenant has no content yet. */
  compact?: boolean;
}

export function SetupInProgress({ host, compact = false }: SetupInProgressProps) {
  return (
    <section
      className={
        compact
          ? 'mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-6 py-20 text-center'
          : 'mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 py-16 text-center'
      }
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <div className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-amber-700 uppercase">
        Site setup in progress
      </div>
      <h1 className="m-0 mb-3 text-[28px] leading-[1.18] font-semibold tracking-[-0.02em] text-slate-900">
        We&apos;re getting this site ready
      </h1>
      <p className="m-0 mb-6 text-[14px] leading-[1.6] text-slate-600">
        <span className="font-mono text-[13px] text-slate-700">{host}</span> isn&apos;t live yet.
        The operator needs to finish onboarding before the public site goes up.
        Please check back shortly.
      </p>
      <p className="text-[12px] text-slate-500">
        Operator? Sign in at{' '}
        <a
          href="https://app.fleethq.io"
          className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
        >
          app.fleethq.io
        </a>{' '}
        to register this domain and publish your site.
      </p>
    </section>
  );
}
