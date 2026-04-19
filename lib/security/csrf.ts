/**
 * Same-origin CSRF guard for mutating API routes.
 *
 * Browsers always send an `Origin` header on non-simple cross-origin requests
 * (including POST/DELETE with cookies). We compare it — or the `Referer`
 * fallback — against the server's `Host` header. A mismatch means the request
 * originated from a different site and must be rejected.
 *
 * This covers the standard CSRF attack vector. It does not replace
 * authentication or authorisation checks.
 */
export function checkCsrfOrigin(request: Request): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const source = origin ?? referer;

  if (!source) {
    // Reject requests that carry neither Origin nor Referer.
    // Legitimate browsers always set at least one on fetch() calls.
    return false;
  }

  try {
    const { host: sourceHost } = new URL(source);
    return sourceHost === host;
  } catch {
    return false;
  }
}
