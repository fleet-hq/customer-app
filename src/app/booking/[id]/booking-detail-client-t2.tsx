'use client';

import { useState } from 'react';

import { Dyn } from '@/components/i18n/Dyn';
import { BookingDashboard } from '@/components/booking/booking-dashboard';
import { RentalAgreementSignModal } from '@/components/booking/rental-agreement-sign-modal';
import { SquarePayModal } from '@/components/booking/square-pay-modal';
import { useBookingPayment } from '@/hooks/use-booking-payment';
import { useGiveRenterNotice, useRenterRental } from '@/hooks/useRentalSiteConfig';
import { gigDashboard } from '@/lib/gig-dashboard';
import { paths } from '@/lib/paths';
import styles from '@/styles/template-2.module.css';
import { useBookingDetail } from './use-booking-detail';

export default function BookingDetailClientT2({ id }: { id: string }) {
  const bd = useBookingDetail(id);
  const [returnDate, setReturnDate] = useState('');

  const ongoing = bd.status === 'ready' && bd.booking.rentalModel !== 'daily';
  const { data: rental } = useRenterRental(id, ongoing);
  const notice = useGiveRenterNotice(id);
  const pay = useBookingPayment(id, ongoing);

  if (bd.status === 'loading') {
    return (
      <div className={styles.centerState}>
        <p style={{ color: 'var(--text-muted)' }}>
          <Dyn>Loading your rental…</Dyn>
        </p>
      </div>
    );
  }

  if (bd.status === 'link-expired' || bd.status === 'not-found') {
    const expired = bd.status === 'link-expired';
    return (
      <div className={styles.centerState}>
        <h1 style={{ marginTop: '0.9rem' }}>
          <Dyn>{expired ? 'This booking link has expired' : 'Booking not found'}</Dyn>
        </h1>
        <p style={{ maxWidth: '30rem' }}>
          <Dyn>
            {expired
              ? 'For your security, booking links stop working once the trip is over. Your booking is safe — look it up with your reference and email.'
              : 'We couldn’t load this booking. Check the link from your confirmation email, or look it up with your reference and email.'}
          </Dyn>
        </p>
        <a href={paths.manage} className={`${styles.btn} ${styles.btnBrass}`} style={{ marginTop: '1.1rem' }}>
          <Dyn>Manage your booking</Dyn>
        </a>
      </div>
    );
  }

  const {
    booking,
    agreementSigned,
    agreementHref,
    agreementModalOpen,
    setAgreementModalOpen,
    signAgreement,
    agreementPreviewData,
    saveCardOnly,
    providersData,
    squareModalOpen,
    setSquareModalOpen,
    payLoading,
    payError,
    payAmount,
    handleSquarePaySubmit,
    tenant,
  } = bd;

  const view = rental
    ? gigDashboard({
        rental,
        vehicleName: booking.vehicle.name,
        bookingRef: booking.invoice.number,
        pickupAt: booking.pickUp.rawDatetime ?? null,
        deposit: booking.invoice.deposit || 0,
        outstanding: pay.outstanding,
      })
    : null;

  return (
    <main className="pg">
      <BookingDashboard
        view={view}
        bookingId={id}
        vehicleName={booking.vehicle.name}
        vehicleYear={booking.vehicle.year}
        vehicleImage={booking.vehicle.image}
        fallbackEyebrow={`${booking.vehicle.name} · ${booking.invoice.number}`}
        fallbackTitle={booking.vehicle.name}
        fallbackState={booking.status}
        rental={rental}
        outstanding={pay.outstanding}
        payLoading={pay.payLoading}
        onPay={pay.handlePay}
        agreementSigned={agreementSigned}
        agreementHref={agreementHref}
        onSignAgreement={() => setAgreementModalOpen(true)}
        onUpdateCard={saveCardOnly}
        returnDate={returnDate}
        onReturnDate={setReturnDate}
        onGiveNotice={() => returnDate && notice.mutate(returnDate)}
        noticePending={notice.isPending}
        noticeError={notice.isError ? notice.error : null}
      />

      <RentalAgreementSignModal
        open={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        onSigned={signAgreement}
        data={agreementPreviewData ?? undefined}
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
    </main>
  );
}
