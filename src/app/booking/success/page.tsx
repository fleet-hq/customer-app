'use client';

import { Suspense } from 'react';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useBookingSuccess } from './use-booking-success';
import BookingSuccessClientT2 from './success-client-t2';

function SuccessContent() {
  const { tenant, phase, errorMessage, t, router } = useBookingSuccess();

  if (tenant.websiteTemplate === 'template_2') {
    return <BookingSuccessClientT2 />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          {phase !== 'error' ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-ink">
                {phase === 'processing' ? t('Finalising your booking…') : t('Confirming payment…')}
              </h1>
              <p className="text-sm text-muted">
                {phase === 'processing'
                  ? t('Stripe is processing your payment. This usually takes just a moment.')
                  : t('One second while we set up your reservation.')}
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-semibold text-ink"><Dyn>Something went wrong</Dyn></h1>
              <p className="mb-6 text-sm text-muted">{t(errorMessage)}</p>
              <button
                onClick={() => router.replace(paths.home)}
                className="rounded-[10px] bg-primary px-6 py-3 text-sm font-semibold text-white"
              >
                <Dyn>Back to home</Dyn>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SuccessContent />
    </Suspense>
  );
}
