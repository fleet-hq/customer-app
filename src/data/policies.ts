export interface PolicySection {
  heading: string;
  paras: string[];
}

export const PRIVACY_INTRO =
  'This Privacy Policy explains how {company} collects, uses, and protects your personal information when you browse our website, create a reservation, and rent a vehicle from us. By using our services you agree to the practices described below.';

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    heading: '1. Information We Collect',
    paras: [
      'When you make a reservation or create an account with {company}, we collect personal information you provide directly, including your name, email address, phone number, billing and home address, date of birth, and driver’s license details. To complete a rental we also collect payment information and proof of insurance.',
      'We automatically collect certain technical information when you visit our website, such as your IP address, browser type, device identifiers, and pages viewed. This helps us keep the site secure and understand how it is used.',
    ],
  },
  {
    heading: '2. How We Use Your Information',
    paras: [
      'We use your information to process and manage your reservations, verify your identity and eligibility to rent, communicate with you about your booking, take payment, and provide customer support. We may also use it to comply with legal obligations and to prevent fraud or misuse of our vehicles.',
    ],
  },
  {
    heading: '3. Cookies & Tracking Technologies',
    paras: [
      'Our website uses cookies and similar technologies to keep you signed in, remember your preferences, and measure site performance. You can control or disable cookies through your browser settings, though some features of the site may not function properly without them.',
    ],
  },
  {
    heading: '4. Third-Party Service Providers',
    paras: [
      'We share your information only with trusted third parties that help us operate our business. Payments are processed securely by Stripe, and we do not store full card numbers on our systems.',
    ],
  },
  {
    heading: '5. Your Rights',
    paras: [
      'Depending on where you live, you may have the right to access, correct, or delete the personal information we hold about you. To exercise any of these rights, please contact {company} using the details below.',
    ],
  },
  {
    heading: '6. Contact Us',
    paras: [
      'If you have questions about this Privacy Policy or how {company} handles your personal information, please reach out to us using the phone number, email, and address listed in the footer of this website.',
    ],
  },
];

export const DEFAULT_TERMS_SECTIONS: PolicySection[] = [
  {
    heading: '1. Eligibility & Driver Requirements',
    paras: [
      "To rent a vehicle from {company}, the primary driver must be at least 21 years of age and hold a valid, unexpired driver's license. Drivers between 21 and 24 may be subject to a standard Young Driver surcharge, which will be disclosed clearly at the time of booking.",
      "All drivers must provide proof of active automobile insurance and a valid form of payment in the renter's name.",
    ],
  },
  {
    heading: '2. Reservations & Payment',
    paras: [
      'A reservation is confirmed once a deposit has been authorized against the payment method provided. The renter must be the cardholder and may be asked to present the physical card at pickup.',
      'Rates quoted include the base daily rate and any extras you select. Applicable taxes and fees, where they apply, are itemized on your invoice before you confirm.',
    ],
  },
  {
    heading: '3. Insurance, Protection & Liability',
    paras: [
      'Renters may provide their own qualifying insurance or select one of our protection plans at checkout. The renter is responsible for the vehicle for the full duration of the rental.',
      'Any incident, accident, or mechanical issue must be reported to {company} immediately.',
    ],
  },
  {
    heading: '4. Fuel, Mileage & Returns',
    paras: [
      'Vehicles are supplied with a full tank of fuel and must be returned full unless the Prepaid Fuel option was purchased.',
      "Vehicles must be returned to the agreed drop-off location at the scheduled time. Late returns may incur an additional day's charge.",
    ],
  },
  {
    heading: '5. Cancellations & Modifications',
    paras: [
      'Reservations may be cancelled or modified through your booking dashboard. Cancellations made within the free-cancellation window are fully refundable.',
    ],
  },
];
