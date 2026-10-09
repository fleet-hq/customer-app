'use client';

import { use } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { VerifyFirstConfirm } from '@/components/booking/verify-first-confirm';
import { SquarePayModal } from '@/components/booking/square-pay-modal';
import { paths } from '@/lib/paths';
import { useBookingDetail } from './use-booking-detail';
import BookingDetailClientT2 from './booking-detail-client-t2';
import { RentalAgreementSignModal } from '@/components/booking/rental-agreement-sign-modal';

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const bd = useBookingDetail(id);

  if (bd.tenant.websiteTemplate === 'template_2') {
    return <BookingDetailClientT2 id={id} />;
  }

  if (bd.status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col items-center justify-center gap-4 px-6 py-32">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-card-border border-t-primary" />
          <p className="text-sm text-muted">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (bd.status === 'link-expired') {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={paths.home}>Back to home</BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink">This booking link has expired</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              For your security, booking links stop working once the trip is over.
              Your booking is safe — look it up with your booking reference and
              email to carry on.
            </p>
            <a
              href={paths.manage}
              className="mt-6 inline-flex items-center justify-center rounded-[9px] bg-primary px-6 py-3 text-[13px] font-semibold text-white hover:bg-primary-hover"
            >
              Manage your booking
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (bd.status === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <div className="mx-auto w-full max-w-[1140px] flex-1 px-6 pt-[22px] pb-16">
          <BackLink href={paths.home}>Back to home</BackLink>
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-semibold text-ink">Booking not found</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              We couldn’t load this booking. Check the link from your confirmation
              email, or look it up with your booking reference and email.
            </p>
            <a
              href={paths.manage}
              className="mt-6 inline-flex items-center justify-center rounded-[9px] border border-card-border px-6 py-3 text-[13px] font-semibold text-secondary hover:bg-subtle"
            >
              Manage your booking
            </a>
          </div>
        </div>
      </div>
    );
  }

  const {
    booking,
    balance,
    outstanding,
    mode,
    holdCountdownLabel,
    holdExpired,
    idVerified,
    insuranceVerified,
    insuranceFailed,
    insuranceDetails,
    showInsuranceStep,
    requireId,
    requireInsurance,
    idPending,
    idError,
    idSent,
    insurancePending,
    insuranceError,
    insuranceLinkAlreadySent,
    allRequiredChecksDone,
    consentChecksDone,
    saveCardOnly,
    handlePay,
    payLoading,
    payError,
    agreementSigned,
    staffAskedForCard,
    saveCard,
    chooseSaveCard,
    agreementModalOpen,
    signAgreement,
    setAgreementModalOpen,
    agreementPreviewData,
    agreementHref,
    secondaryDrivers,
    tokenReady,
    isCancelled,
    isReserved,
    manualIdSubmission,
    manualInsuranceSubmission,
    refetchManual,
    preTrip,
    postTrip,
    token,
    providersData,
    tenant,
    payAmount,
    squareModalOpen,
    setSquareModalOpen,
    handleSquarePaySubmit,
    handleIdVerify,
    handleInsuranceVerify,
  } = bd;

  return (
    <>
    <VerifyFirstConfirm
      booking={booking}
      backHref={mode === 'pending_verification' ? paths.checkout(String(booking.fleetId)) : paths.home}
      mode={mode}
      outstanding={outstanding}
      charges={balance?.charges ?? []}
      paymentPendingHref={`/booking/${id}/payment-pending${token ? `?token=${token}` : ''}`}
      holdCountdownLabel={holdCountdownLabel}
      holdExpired={holdExpired}
      idVerified={idVerified}
      insuranceVerified={insuranceVerified}
      insuranceFailed={insuranceFailed}
      insuranceFailureDetails={insuranceFailed ? insuranceDetails : null}
      requireId={requireId}
      requireInsurance={showInsuranceStep}
      insuranceBlocking={requireInsurance}
      idPending={idPending}
      idError={idError}
      idLinkSent={idSent || idVerified}
      onIdVerify={handleIdVerify}
      insurancePending={insurancePending}
      insuranceError={insuranceError}
      insuranceLinkSent={insuranceLinkAlreadySent}
      onInsuranceVerify={handleInsuranceVerify}
      allRequiredChecksDone={allRequiredChecksDone}
      consentChecksDone={consentChecksDone}
      onSaveCardOnly={saveCardOnly}
      hasCardOnFile={!!booking?.cardOnFile}
      onPay={handlePay}
      payLoading={payLoading}
      payError={payError}
      agreementSigned={agreementSigned}
      agreementHref={agreementHref}
      staffAskedForCard={staffAskedForCard}
      saveCard={saveCard}
      onChooseSaveCard={chooseSaveCard}
      companyName={tenant.name}
      depositAmount={booking?.invoice.deposit}
      onSignAgreement={() => setAgreementModalOpen(true)}
      bookingId={id}
      token={token}
      secondaryDrivers={secondaryDrivers ?? []}
      rentalStartDate={booking.pickUp.rawDatetime.slice(0, 10)}
      rentalEndDate={booking.dropOff.rawDatetime.slice(0, 10)}
      canModify={booking.canModify}
      preTripPhotos={preTrip}
      postTripPhotos={postTrip}
      isReserved={isReserved}
      manualIdSubmission={manualIdSubmission}
      manualInsuranceSubmission={manualInsuranceSubmission}
      onManualUploaded={refetchManual}
      canUploadPhotos={tokenReady && !isCancelled}
    />
      <RentalAgreementSignModal
        open={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        data={agreementPreviewData ?? undefined}
        onSigned={async (dataUri) => {
          await signAgreement(dataUri);
          setAgreementModalOpen(false);
        }}
      />

    {providersData?.square && (
      <SquarePayModal
        open={squareModalOpen}
        onClose={() => !payLoading && setSquareModalOpen(false)}
        applicationId={providersData.square.application_id}
        locationId={providersData.square.location_id}
        environment={(providersData.square.environment as 'sandbox' | 'production') || 'production'}
        amount={payAmount}
        currency="usd"
        deposit={booking.invoice.deposit || 0}
        tenantName={tenant?.name}
        submitting={payLoading}
        error={payError}
        onSubmit={handleSquarePaySubmit}
      />
    )}
    </>
  );
}
