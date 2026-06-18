import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { BookingActions, ConfirmedBanner } from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails, Invoice } from '@/components/booking/summary-cards';
import { NextSteps, TripPhotos } from '@/components/booking/side-panels';
import { SAMPLE_BOOKING } from '@/lib/mock-data';
import { paths } from '@/lib/paths';

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  await params;

  return (
    <div className="bg-white text-ink">
      <Header />
      <div className="mx-auto max-w-[1140px] px-6 pt-[22px] pb-16">
        <BackLink href={paths.home}>Back to home</BackLink>

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[14px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
            Booking <span className="text-secondary">#{SAMPLE_BOOKING.id}</span>
          </h1>
          <BookingActions bookingId={SAMPLE_BOOKING.id} />
        </div>

        <ConfirmedBanner email={SAMPLE_BOOKING.confirmationEmail} />

        <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] min-[900px]:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[22px]">
            <VehicleDriverCard booking={SAMPLE_BOOKING} />
            <TripDetails booking={SAMPLE_BOOKING} />
            <Invoice booking={SAMPLE_BOOKING} />
          </div>

          <div className="flex flex-col gap-[18px]">
            <NextSteps />
            <TripPhotos
              note="Document the car before & after your trip to protect your deposit."
              groups={[
                { title: 'Pre-trip', hint: 'Add before pickup' },
                { title: 'Post-trip', hint: 'Add at drop-off' },
              ]}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
