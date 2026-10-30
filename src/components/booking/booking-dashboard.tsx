'use client';

import type { ReactNode } from 'react';

import { Dyn } from '@/components/i18n/Dyn';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar } from '@/components/ui/icons';
import { extractApiErrorMessage } from '@/lib/api-errors';
import type { GigDashboard } from '@/lib/gig-dashboard';
import { paths } from '@/lib/paths';
import { money } from '@/lib/utils';
import type { RenterRental } from '@/services/rentalServices';

export interface BookingDashboardProps {
  view: GigDashboard | null;
  bookingId: string;
  vehicleName: string;
  vehicleYear: number | string;
  vehicleImage?: string;
  fallbackEyebrow: string;
  fallbackTitle: string;
  fallbackState: string;
  rental: RenterRental | null | undefined;
  outstanding: number;
  payLoading: boolean;
  onPay: () => void;
  agreementSigned: boolean;
  agreementHref?: string | null;
  onSignAgreement: () => void;
  onUpdateCard: () => void;
  returnDate: string;
  onReturnDate: (next: string) => void;
  onGiveNotice: () => void;
  noticePending: boolean;
  noticeError: unknown;
  children?: ReactNode;
}

export function BookingDashboard({
  view,
  bookingId,
  vehicleName,
  vehicleYear,
  vehicleImage,
  fallbackEyebrow,
  fallbackTitle,
  fallbackState,
  rental,
  outstanding,
  payLoading,
  onPay,
  agreementSigned,
  agreementHref,
  onSignAgreement,
  onUpdateCard,
  returnDate,
  onReturnDate,
  onGiveNotice,
  noticePending,
  noticeError,
  children,
}: BookingDashboardProps) {
  return (
      <div className="wrap">
        <a className="crumb" href={paths.manage}>
          ‹ <Dyn>Manage bookings</Dyn>
        </a>

        <div className="gd-hd">
          <div>
            <div className="eyebrow">
              <Dyn>{view ? view.eyebrow : fallbackEyebrow}</Dyn>
            </div>
            <h1>
              <Dyn>{view ? view.title : fallbackTitle}</Dyn>
            </h1>
          </div>
          <span className="st">
            <Dyn>{view ? view.stateLabel : fallbackState}</Dyn>
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
                  {vehicleImage ? <img src={vehicleImage} alt="" /> : null}
                </div>
                <div className="tx">
                  <div>
                    <div className="eyebrow">{vehicleYear}</div>
                    <h3 style={{ marginTop: 6 }}>{vehicleName}</h3>
                  </div>
                  <div className="meta">
                    {(view?.carFacts ?? []).map((fact) => (
                      <span key={fact.label}>
                        <Dyn>{fact.label}</Dyn> <b>{fact.value}</b>
                      </span>
                    ))}
                  </div>
                  <div className="racts">
                    <a className="gb" href={paths.swap(bookingId)}>
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
                  {outstanding > 0 ? (
                    <button className="btn" type="button" onClick={onPay} disabled={payLoading}>
                      <Dyn>{`Pay ${money(outstanding)}`}</Dyn> <span className="chev">›</span>
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
                    <button className="gb" type="button" onClick={() => onSignAgreement()}>
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
                    <button className="gb lt" type="button" onClick={onUpdateCard}>
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
                          onChange={onReturnDate}
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
                            onClick={onGiveNotice}
                            disabled={!returnDate || noticePending}
                          >
                            <Dyn>{noticePending ? 'Saving…' : 'End my plan'}</Dyn>
                          </button>
                        </div>
                        {!!noticeError ? (
                          <p className="pmsg bad">
                            <Dyn>
                              {extractApiErrorMessage(noticeError, 'We couldn’t save your return date. Please try again.')}
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
  );
}
