export const paths = {
  home: '/',
  fleet: '/fleet',
  fleetSearch: (from: string, to: string) => `/fleet?from=${from}&to=${to}`,
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  services: '/services',
  page: (slug: string) => `/${slug}`,
  howItWorks: '/how-it-works',
  about: '/about',
  faq: '/faq',
  inquiry: '/inquiry',
  contact: '/contact',
  // Accepts a vehicle's real slug (preferred — always available on a
  // fetched Vehicle) or, as a fallback where only the numeric id is on
  // hand (e.g. a booking record), the id itself — the backend resolves
  // either at the same lookup path.
  checkout: (slugOrId: string) => `/fleet/${slugOrId}`,
  verifyId: '/booking/verify/id',
  verifyInsurance: '/booking/verify/insurance',
  booking: (id: string) => `/booking/${id}`,
  paymentPending: (id: string) => `/booking/${id}/payment-pending`,
  modify: (id: string) => `/booking/${id}/modify`,
  swap: (id: string) => `/booking/${id}/swap`,
  cancel: (id: string) => `/booking/${id}/cancel`,
  agreement: (id: string | number) => `/rental-agreement/${id}`,
  terms: '/terms',
  privacy: '/privacy',
  manage: '/manage',
  bookings: '/bookings',
  signIn: '/sign-in',
  register: '/register',
} as const;
