/** Privacy Policy copy lives in the FE until a follow-up adds
 *  per-tenant policy editing to the super-admin dashboard. Keeps the
 *  ``{company}`` placeholder so the rendered text is still personalised.
 *  Shared verbatim by both templates' privacy pages. */
export const PRIVACY_INTRO =
  'This Privacy Policy explains how {company} collects, uses, and protects your personal information when you browse our website, create a reservation, and rent a vehicle from us. By using our services you agree to the practices described below.';

export const PRIVACY_SECTIONS: { heading: string; paras: string[] }[] = [
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
