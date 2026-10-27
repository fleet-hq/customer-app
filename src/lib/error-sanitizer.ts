export function sanitizeBackendError(raw?: string | null): string {
  if (!raw) {
    return 'Verification is temporarily unavailable. Please try again or contact support.';
  }
  const stripped = String(raw).replace(
    /\b(sk|pk|rk|whsec)_[A-Za-z0-9_-]+/g,
    '[redacted]',
  );
  if (
    /UnicodeEncodeError|latin-1|codec|communicating with Stripe|Network error|configuration issue/i.test(
      stripped,
    )
  ) {
    return 'Verification is temporarily unavailable. Please try again or contact support.';
  }
  return stripped.length > 200 ? stripped.slice(0, 197) + '…' : stripped;
}
