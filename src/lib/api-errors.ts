export function apiFieldErrors(error: unknown): Record<string, string> {
  if (!error || typeof error !== 'object' || !('response' in error)) return {};
  const body = (error as { response?: { data?: unknown } }).response?.data;
  if (!body || typeof body !== 'object') return {};
  const nested = (body as { errors?: unknown }).errors;
  const source = (nested && typeof nested === 'object' ? nested : body) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    const message = [value].flat().filter((v): v is string => typeof v === 'string').join(' ');
    if (message) fields[key] = message;
  }
  return fields;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const messages = Object.values(apiFieldErrors(error));
  return messages.length > 0 ? messages.join(' ') : fallback;
}
