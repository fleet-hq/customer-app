'use client';

import { useState } from 'react';

import { Dyn } from '@/components/i18n/Dyn';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar } from '@/components/ui/icons';
import { RentalAgreementSignModal } from '@/components/booking/rental-agreement-sign-modal';
import { useBookingPayment } from '@/hooks/use-booking-payment';
import { useGiveRenterNotice, useRenterRental } from '@/hooks/useRentalSiteConfig';
import { gigDashboard } from '@/lib/gig-dashboard';
import { extractApiErrorMessage } from '@/lib/api-errors';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import { BookingDashboard } from '@/components/booking/booking-dashboard';
import { useBookingDetail } from './use-booking-detail';

function CentreState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <main className="pg">
      <div className="wrap" style={{ paddingTop: 80, paddingBottom: 120 }}>
        <h1>
          <Dyn>{title}</Dyn>
        </h1>
        <p className="note" style={{ maxWidth: 520 }}>
          <Dyn>{body}</Dyn>
        </p>
        <a className="btn" href={href} style={{ marginTop: 18 }}>
          <Dyn>{cta}</Dyn> <span className="chev">›</span>
        </a>
      </div>
    </main>
  );
}

export default function BookingDetailClientT3({ id }: { id: string }) {
  const bd = useBookingDetail(id);
  const [returnDate, setReturnDate] = useState('');

  const ongoing = bd.status === 'ready' && bd.booking.rentalModel !== 'daily';
  const { data: rental } = useRenterRental(id, ongoing);
  const notice = useGiveRenterNotice(id);
  const pay = useBookingPayment(id, ongoing);

  if (bd.status === 'loading') {
    return (
      <main className="pg">
        <div className="wrap" style={{ paddingTop: 80, paddingBottom: 120 }}>
          <p className="note">
            <Dyn>Loading your rental…</Dyn>
          </p>
        </div>
      </main>
    );
  }
  if (bd.status === 'link-expired')
    return (
      <CentreState
        title="This booking link has expired"
        body="For your security, booking links stop working once the trip is over. Your booking is safe — look it up with your reference and email."
        href={paths.manage}
        cta="Manage your booking"
      />
    );
  if (bd.status === 'not-found')
    return (
      <CentreState
        title="Booking not found"
        body="We couldn’t load this booking. Check the link from your confirmation email, or look it up with your reference and email."
        href={paths.manage}
        cta="Manage your booking"
      />
    );

  const {
    booking,
    agreementSigned,
    agreementHref,
    agreementModalOpen,
    setAgreementModalOpen,
    signAgreement,
    agreementPreviewData,
    saveCardOnly,
  } = bd;

  const view =
    rental &&
    gigDashboard({
      rental,
      vehicleName: booking.vehicle.name,
      bookingRef: booking.invoice.number,
      pickupAt: booking.pickUp.rawDatetime ?? null,
      deposit: booking.invoice.deposit || 0,
      outstanding: pay.outstanding,
    });

  const submitNotice = () => {
    if (returnDate) notice.mutate(returnDate);
  };

  return (
    <main className="pg">
      <BookingDashboard
        view={view ?? null}
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
        onGiveNotice={submitNotice}
        noticePending={notice.isPending}
        noticeError={notice.isError ? notice.error : null}
      />

      <RentalAgreementSignModal
        open={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        onSigned={signAgreement}
        data={agreementPreviewData ?? undefined}
      />
    </main>
  );
}
