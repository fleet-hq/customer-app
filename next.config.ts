import type { NextConfig } from 'next';

// Customer-central replaces the per-tenant FHQ apps. The route paths
// changed in a few places between the two apps — keep the old URLs
// reachable so confirmation emails / SMS / bookmarks from the FHQ era
// land somewhere useful instead of 404'ing. Each entry below is one
// FHQ-side path mapped onto its customer-central equivalent.
const LEGACY_FHQ_REDIRECTS: NextConfig['redirects'] = async () => [
  { source: '/manage-booking', destination: '/manage', permanent: true },
  { source: '/fleet/:id/book', destination: '/checkout/:id', permanent: true },
  {
    source: '/booking/:id/edit',
    destination: '/booking/:id/modify',
    permanent: true,
  },
  {
    source: '/booking/:id/edit/checkout',
    destination: '/booking/:id/modify',
    permanent: true,
  },
  {
    source: '/booking/:id/swap/checkout',
    destination: '/booking/:id/swap',
    permanent: true,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fleethq-media.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'backend.fleethq.io',
      },
    ],
  },
  redirects: LEGACY_FHQ_REDIRECTS,
};

export default nextConfig;
