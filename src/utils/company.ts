// Utility for company identification in multi-tenant setup

// Domain to use for API requests - in production uses actual hostname, in dev uses configured domain
const CONFIGURED_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN;

/**
 * Check if we're in development mode (localhost)
 */
export function isDevelopment(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname.includes('localhost') || hostname.includes('127.0.0.1');
  }
  return true; // Assume development for SSR
}

// Resolve the domain for tenant-scoped API requests. Pass an explicit
// override (e.g. `useTenant().domain`) on the client so we never pin
// every request to the single NEXT_PUBLIC_DOMAIN env value when the
// app is serving multiple tenants. Falls back to env / hostname for
// callers that don't yet have a tenant in scope.
export function getDomain(override?: string | null): string | undefined {
  if (override) return override;
  if (CONFIGURED_DOMAIN) return CONFIGURED_DOMAIN;
  if (typeof window !== 'undefined' && !isDevelopment()) {
    return window.location.hostname;
  }
  return undefined;
}

export function getDomainParams(override?: string | null): Record<string, string> {
  const domain = getDomain(override);
  if (domain) return { domain };
  return {};
}

/**
 * Get the current domain (for display purposes)
 */
export function getCurrentDomain(): string | null {
  return getDomain() || null;
}

/**
 * Check if we're in production (using domain) or development (using company ID)
 */
export function isProductionMode(): boolean {
  return !isDevelopment();
}
