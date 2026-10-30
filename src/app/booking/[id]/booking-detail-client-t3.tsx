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
      <div className="wrap">
        <a className="crumb" href={paths.manage}>
          ‹ <Dyn>Manage bookings</Dyn>
        </a>

        <div className="gd-hd">
          <div>
            <div className="eyebrow">
              <Dyn>{view ? view.eyebrow : `${booking.vehicle.name} · ${booking.invoice.number}`}</Dyn>
            </div>
            <h1>
              <Dyn>{view ? view.title : booking.vehicle.name}</Dyn>
            </h1>
          </div>
          <span className="st">
            <Dyn>{view ? view.stateLabel : booking.status}</Dyn>
          </span>
        </div>

        {view ? (
          <div className="kp">
            {view.stats.map((stat) => (
              <div key={stat.key}>
                <span>
                  <Dyn>{stat.label}</Dyn>
                </span>
                <b className={stat.due ? 'due' : undefined}>{stat.value}</b>
                <small>
                  <Dyn>{stat.note}</Dyn>
                </small>
              </div>
            ))}
          </div>
        ) : null}

        <div className="gd">
          <div>
            <div className="blk">
              <h2>
                <i />
                <Dyn>Your car</Dyn>
              </h2>
              <div className="cc">
                <div className="im">
                  {booking.vehicle.image ? <img src={booking.vehicle.image} alt="" /> : null}
                </div>
                <div className="tx">
                  <div>
                    <div className="eyebrow">{booking.vehicle.year}</div>
                    <h3 style={{ marginTop: 6 }}>{booking.vehicle.name}</h3>
                  </div>
                  <div className="meta">
                    {(view?.carFacts ?? []).map((fact) => (
                      <span key={fact.label}>
                        <Dyn>{fact.label}</Dyn> <b>{fact.value}</b>
                      </span>
                    ))}
                  </div>
                  <div className="racts">
                    <a className="gb" href={paths.swap(id)}>
                      <Dyn>Swap car</Dyn>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {view ? (
              <div className="blk">
                <div className="bh">
                  <h2>
                    <i />
                    <Dyn>Payments</Dyn>
                  </h2>
                  {pay.outstanding > 0 ? (
                    <button className="btn" type="button" onClick={pay.handlePay} disabled={pay.payLoading}>
                      <Dyn>{`Pay ${money(pay.outstanding)}`}</Dyn> <span className="chev">›</span>
                    </button>
                  ) : null}
                </div>
                <div className="lst lg">
                  {view.rows.map((row) => (
                    <div key={row.key}>
                      <span className="d">{row.date}</span>
                      <span>
                        <Dyn>{row.label}</Dyn>
                      </span>
                      <span className="a">{row.amount}</span>
                      <span className={`st ${row.tone}`}>
                        <Dyn>{row.status}</Dyn>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="blk">
              <h2>
                <i />
                <Dyn>Documents</Dyn>
              </h2>
              <div className="lst">
                <div>
                  <span>
                    <b>
                      <Dyn>Rental agreement</Dyn>
                    </b>
                    <small>
                      <Dyn>{agreementSigned ? 'Signed. A copy is attached to this booking.' : 'Not signed yet.'}</Dyn>
                    </small>
                  </span>
                  {agreementSigned && agreementHref ? (
                    <a className="gb" href={agreementHref} target="_blank" rel="noreferrer">
                      <Dyn>View</Dyn>
                    </a>
                  ) : (
                    <button className="gb" type="button" onClick={() => setAgreementModalOpen(true)}>
                      <Dyn>Sign</Dyn>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {view && view.activity.length > 0 ? (
              <div className="blk">
                <h2>
                  <i />
                  <Dyn>Activity</Dyn>
                </h2>
                <ul className="docs">
                  {view.activity.map((item) => (
                    <li key={item.key}>
                      <span>
                        <Dyn>{item.title}</Dyn>
                      </span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{item.at}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="sum">
            {view ? (
              <>
                <section>
                  <h3>
                    <Dyn>Billing</Dyn> <span className="daypill">{view.cycleBadge}</span>
                  </h3>
                  <div className="bar">
                    <i style={{ width: `${view.progress}%` }} />
                  </div>
                  <div className="kv">
                    <span>{view.cycleStart}</span>
                    <span>{view.cycleEnd}</span>
                  </div>
                </section>

                <section>
                  <h5>
                    <Dyn>{view.nextChargeHeading}</Dyn>
                  </h5>
                  {view.nextChargeLines.map((line) => (
                    <div className="ln" key={line.label}>
                      <span>
                        <Dyn>{line.label}</Dyn>
                        {line.detail ? <small>{line.detail}</small> : null}
                      </span>
                      <span>{line.amount}</span>
                    </div>
                  ))}
                  <div className="total" style={{ marginTop: 10 }}>
                    <span>
                      <Dyn>Total</Dyn>
                    </span>
                    <div>
                      <small>USD</small>
                      <b>{view.nextChargeTotal}</b>
                    </div>
                  </div>
                  <p className="note">
                    <Dyn>{view.autopayNote}</Dyn>
                  </p>
                  <div className="btns">
                    <button className="gb lt" type="button" onClick={saveCardOnly}>
                      <Dyn>Update card</Dyn>
                    </button>
                  </div>
                </section>

                <section>
                  <h5>
                    <Dyn>Your plan</Dyn>
                  </h5>
                  <div className="pt">
                    <Dyn>{view.planHeading}</Dyn>
                  </div>
                  <p className="ps">
                    <Dyn>{view.planNote}</Dyn>
                  </p>
                  {rental && !rental.closed ? (
                    rental.notice_return_date ? (
                      <p className="ps">
                        <Dyn>Returning on</Dyn> {rental.notice_return_date}
                      </p>
                    ) : (
                      <>
                        <DatePicker
                          value={returnDate}
                          onChange={setReturnDate}
                          minDate={rental.earliest_return_date}
                          placeholder="Pick a return date"
                          aria-label="Return date"
                          icon={<Calendar size={15} />}
                          className="lfield"
                        />
                        <div className="btns" style={{ gridTemplateColumns: '1fr' }}>
                          <button
                            className="gb lt"
                            type="button"
                            onClick={submitNotice}
                            disabled={!returnDate || notice.isPending}
                          >
                            <Dyn>{notice.isPending ? 'Saving…' : 'End my plan'}</Dyn>
                          </button>
                        </div>
                        {notice.isError ? (
                          <p className="pmsg bad">
                            <Dyn>
                              {extractApiErrorMessage(notice.error, 'We couldn’t save your return date. Please try again.')}
                            </Dyn>
                          </p>
                        ) : null}
                      </>
                    )
                  ) : null}
                </section>
              </>
            ) : null}
          </aside>
        </div>
      </div>

      <RentalAgreementSignModal
        open={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        onSigned={signAgreement}
        data={agreementPreviewData ?? undefined}
      />
    </main>
  );
}
