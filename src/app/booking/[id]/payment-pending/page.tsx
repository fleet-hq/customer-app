import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BackLink } from '@/components/ui/back-link';
import { BookingActions, PaymentDueBanner } from '@/components/booking/booking-chrome';
import { VehicleDriverCard, TripDetails, Invoice } from '@/components/booking/summary-cards';
import { NextSteps, TripPhotos } from '@/components/booking/side-panels';
import { SAMPLE_BOOKING } from '@/lib/mock-data';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';

export default async function PaymentPendingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="bg-white text-ink">
      <Header />
      <div className="mx-auto max-w-[1140px] px-6 pt-[22px] pb-16">
        <BackLink href={paths.booking(id)}>Back to booking</BackLink>

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[14px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
            Booking <span className="text-secondary">#{SAMPLE_BOOKING.id}</span>
          </h1>
          <BookingActions bookingId={SAMPLE_BOOKING.id} />
        </div>

        <PaymentDueBanner amount={money(SAMPLE_BOOKING.modificationCharge)} />

        <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] min-[900px]:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[22px]">
            <VehicleDriverCard booking={SAMPLE_BOOKING} />
            <TripDetails booking={SAMPLE_BOOKING} />
            <Invoice booking={SAMPLE_BOOKING} />
          </div>

          <div className="flex flex-col gap-[18px]">
            <NextSteps />
            <TripPhotos
              note="Your trip photos are on file."
              groups={[
                {
                  title: 'Pre-trip',
                  count: '3 photos',
                  photos: [
                    { src: '/images/car-cherokee.png', pos: 'center' },
                    { src: '/images/car-cherokee.png', pos: '25% center' },
                    { src: '/images/car-cherokee.png', pos: '75% center' },
                  ],
                },
                {
                  title: 'Post-trip',
                  count: '2 photos',
                  photos: [
                    { src: '/images/car-cherokee.png', pos: '40% center' },
                    { src: '/images/car-cherokee.png', pos: '60% center' },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
