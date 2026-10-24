/**
 * Session-cookie `Secure` resolution (single source of truth, pure).
 *
 * Rules:
 * - `COOKIE_SECURE=true` stays the explicit override (documented opt-in);
 * - otherwise a request seen as HTTPS — behind a reverse proxy that emits
 *   `x-forwarded-proto` — gets the Secure flag automatically;
 * - plain-http requests (the localhost demo) keep it unset: browsers refuse
 *   to store Secure cookies received over http.
 *
 * Kept dependency-free so it can be unit-tested with the Node built-in
 * runner (`frontend/tests/session-cookie.test.mjs`).
 */
export function resolveCookieSecure(
  forwardedProto?: string | null,
  envSecure?: boolean,
): boolean {
  const env = envSecure ?? process.env.COOKIE_SECURE === 'true';
  if (env) return true;
  const proto = forwardedProto?.split(',')[0]?.trim().toLowerCase();
  return proto === 'https';
}
