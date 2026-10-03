'use client';

import { VerifyFirstConfirm } from '@/components/booking/verify-first-confirm';
import { SquarePayModal } from '@/components/booking/square-pay-modal';
import { paths } from '@/lib/paths';
import { Dyn } from '@/components/i18n/Dyn';
import { useBookingDetail } from './use-booking-detail';
import styles from '@/styles/template-2.module.css';

export default function BookingDetailClientT2({ id }: { id: string }) {
  const bd = useBookingDetail(id);

  if (bd.status === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}><Dyn>Loading booking…</Dyn></p>
      </div>
    );
  }

  if (bd.status === 'link-expired') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.6rem' }}>
        <a href={paths.home} className={styles.linkMore}><Dyn>Back to home</Dyn></a>
        <h1 style={{ marginTop: '0.9rem' }}><Dyn>This booking link has expired</Dyn></h1>
        <p style={{ maxWidth: '30rem' }}>
          <Dyn>
            For your security, booking links stop working once the trip is over.
            Your booking is safe — look it up with your booking reference and email to carry on.
          </Dyn>
        </p>
        <a href={paths.manage} className={`${styles.btn} ${styles.btnBrass}`} style={{ marginTop: '1.1rem' }}>
          <Dyn>Manage your booking</Dyn>
        </a>
      </div>
    );
  }

  if (bd.status === 'not-found') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.6rem' }}>
        <a href={paths.home} className={styles.linkMore}><Dyn>Back to home</Dyn></a>
        <h1 style={{ marginTop: '0.9rem' }}><Dyn>Booking not found</Dyn></h1>
        <p style={{ maxWidth: '30rem' }}>
          <Dyn>
            We couldn’t load this booking. Check the link from your confirmation email,
            or look it up with your booking reference and email.
          </Dyn>
        </p>
        <a href={paths.manage} className={styles.linkMore} style={{ marginTop: '0.8rem' }}>
          <Dyn>Manage your booking</Dyn>
        </a>
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
    handlePay,
    payLoading,
    payError,
    agreementSigned,
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

  // VerifyFirstConfirm is the complex payment/verification/legal
  // component (holds Stripe/Square payment kickoff, ID + insurance
  // verification, agreement + photo upload) — reused unchanged here
  // rather than reimplemented, per the same trade-off already made for
  // the fleet-detail page's payment widgets. Only the page chrome above
  // (loading/not-found states) is restyled for template 2.
  return (
    <div className={styles.section} style={{ paddingTop: 0 }}>
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
        onPay={handlePay}
        payLoading={payLoading}
        payError={payError}
        agreementSigned={agreementSigned}
        agreementHref={agreementHref}
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
    </div>
  );
}
