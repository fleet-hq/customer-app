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

export function extractBackendErrorMessage(error: unknown, fallback: string): string {
  const errData =
    (error as { response?: { data?: { errors?: Record<string, unknown> } } })?.response?.data?.errors ??
    (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!errData || typeof errData !== 'object') return fallback;
  const data = errData as Record<string, unknown>;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return String(data.non_field_errors[0]);
  }
  if (data.detail) {
    return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  }
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    return Array.isArray(val) ? String(val[0]) : String(val);
  }
  return fallback;
}
