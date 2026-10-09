'use client';

import { useEffect, useState } from 'react';

/** The renter's answer on keeping a card for incidentals.
 *
 *  A renter can reach a payment from three places — the pay link, the
 *  payment-pending page, and the booking page itself — and the emailed
 *  link lands on whichever suits the booking. All three ask the same
 *  question, so they share this rather than each keeping their own copy
 *  and drifting; a page that forgets it silently takes no consent, and
 *  the server then refuses to file a card.
 *
 *  Pass `cardOnFileRequested` from the booking: staff asking is what
 *  makes the question appear at all.
 */
export function useCardConsent(cardOnFileRequested?: boolean) {
  const staffAskedForCard = !!cardOnFileRequested;
  const [saveCard, setSaveCard] = useState(false);
  const [touched, setTouched] = useState(false);

  // Seeded from staff's request, but only until the renter answers —
  // otherwise a refetch would quietly undo their untick.
  useEffect(() => {
    if (!touched) setSaveCard(staffAskedForCard);
  }, [staffAskedForCard, touched]);

  const chooseSaveCard = (next: boolean) => {
    setTouched(true);
    setSaveCard(next);
  };

  // Spread into createBillingCheckoutSession. Empty when staff never
  // asked, so the booking's own setting decides and nothing is implied
  // on the renter's behalf.
  const checkoutConsent = staffAskedForCard
    ? { saveCard, cardConsent: saveCard }
    : {};

  return { staffAskedForCard, saveCard, chooseSaveCard, checkoutConsent };
}
