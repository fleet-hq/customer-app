import { cycleWords } from '@/lib/billing-cycle';
import { weeklyDepositTiming } from '@/lib/price-rows';
import { money } from '@/lib/utils';
import type { OngoingOffer, PeriodPrice } from '@/services/rentalServices';

export interface InvoiceLine {
  key: string;
  label: string;
  detail?: string;
  amount: string;
  muted?: boolean;
}

export interface InvoiceGroup {
  key: string;
  heading: string;
  action?: 'protection';
  lines: InvoiceLine[];
}

export interface OngoingInvoice {
  cycleBadge: string;
  groups: InvoiceGroup[];
  cycleLabel: string;
  cycleTotal: string;
  note: string;
  dueLines: InvoiceLine[];
  endingHeading: string;
  endingBody: string;
  insuranceTick: string;
}

const INSURANCE_LINE: Record<string, string> = {
  own_rideshare_required: 'Your own rideshare policy',
  included_in_plan: 'Liability insurance',
};

const CHARGE_LINES: [keyof PeriodPrice, string][] = [
  ['location_charges', 'Pick-up and delivery'],
  ['booking_fee', 'Booking fee'],
  ['setup_fee', 'Setup fee'],
];

const amount = (value: string | number | null | undefined) => Number(value ?? 0);

function endingBody(minWeeks: number, noticeDays: number) {
  const notice = noticeDays ? `with ${noticeDays} days' notice` : 'whenever you like';
  if (!minWeeks) return `End your plan any time ${notice}.`;
  return `${minWeeks}-week minimum, then end any time ${notice}.`;
}

export function ongoingInvoice(offer: OngoingOffer): OngoingInvoice {
  const words = cycleWords(offer.billing_cycle);
  const period = offer.recurring;
  const weeks = words.weeksPerCycle;
  const weeklyRate = offer.weekly_rate ? amount(offer.weekly_rate) : null;
  const deposit = amount(offer.deposit);
  const cycleTotal = amount(period.total);
  const perWeek = weeks > 0 ? cycleTotal / weeks : cycleTotal;
  const spanLabel = weeks === 1 ? '1 week' : `${Math.round(weeks)} weeks`;

  const rental: InvoiceLine[] = [
    {
      key: 'rental',
      label: 'Car rental',
      detail: weeklyRate ? `${money(weeklyRate)} × ${spanLabel}` : words.rentalLine(weeklyRate),
      amount: money(amount(period.rental)),
    },
  ];

  const protection: InvoiceLine[] = [
    {
      key: 'insurance',
      label: INSURANCE_LINE[offer.insurance_mode] ?? 'Your own insurance policy',
      amount: offer.insurance_mode === 'included_in_plan' ? 'Included' : 'Required',
      muted: offer.insurance_mode !== 'included_in_plan',
    },
  ];

  const addOns: InvoiceLine[] =
    amount(period.extras) > 0
      ? [{ key: 'extras', label: 'Add-ons', amount: money(amount(period.extras)) }]
      : [{ key: 'extras-none', label: 'None added yet', amount: money(0), muted: true }];

  const charges: InvoiceLine[] = [
    ...CHARGE_LINES.filter(([key]) => amount(period[key]) > 0).map(([key, label]) => ({
      key: String(key),
      label,
      amount: money(amount(period[key])),
    })),
    ...(amount(period.tax) > 0 ? [{ key: 'tax', label: 'Taxes', amount: money(amount(period.tax)) }] : []),
  ];

  const groups: InvoiceGroup[] = [
    { key: 'rental', heading: 'Rental', lines: rental },
    { key: 'protection', heading: 'Protection', action: 'protection', lines: protection },
    { key: 'addons', heading: 'Add-ons', lines: addOns },
    ...(charges.length > 0 ? [{ key: 'taxes', heading: 'Charges & taxes', lines: charges }] : []),
  ];

  const firstTotal = amount(offer.first.total);
  const oneOff = firstTotal - cycleTotal;
  const dueLines: InvoiceLine[] = [
    {
      key: 'first',
      label: weeks === 1 ? 'First charge' : `First ${Math.round(weeks)}-week charge`,
      detail: oneOff > 0 ? `Includes ${money(oneOff)} of one-off charges` : undefined,
      amount: money(firstTotal),
    },
    {
      key: 'deposit',
      label: 'Security deposit',
      detail: weeklyDepositTiming(offer.deposit_method) === 'hold' ? 'Held on your card' : 'Refundable',
      amount: money(deposit),
    },
    { key: 'due', label: 'Due at pick-up', amount: money(firstTotal + deposit) },
  ];

  return {
    cycleBadge: words.badge,
    groups,
    cycleLabel: words.badge,
    cycleTotal: money(cycleTotal),
    note: `About ${money(perWeek)} a week, all in. ${words.renews(offer)}, ${words.recurringNote}.`,
    dueLines,
    insuranceTick:
      offer.insurance_mode === 'included_in_plan'
        ? 'Liability insurance included'
        : 'Your own insurance policy is required',
    endingHeading: 'Ending your plan',
    endingBody: endingBody(offer.min_term_weeks, offer.return_notice_days),
  };
}
