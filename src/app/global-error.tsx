'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#fff' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            textAlign: 'center',
            fontFamily:
              "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            color: '#131314',
          }}
        >
          <h1
            style={{
              margin: '0 0 14px',
              fontSize: '30px',
              lineHeight: 1.18,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: '13px', lineHeight: 1.6, color: '#637083', maxWidth: 480 }}>
            We hit an unexpected error and couldn&apos;t load the page. Try again, or refresh the browser.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
              background: '#ed2324',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
