/**
 * Minimal secure session for the demo members (Phase 4).
 *
 * The Strapi JWT never reaches the browser: it lives in an httpOnly cookie
 * that only the server (RSC reads + server actions) can see, so neither the
 * member's browser cache nor any client script can exfiltrate the token.
 * A second httpOnly cookie carries only the display username.
 *
 * Under Cache Components any `cookies()` read is a request-time access: the
 * member panel that renders it stays behind a <Suspense> boundary.
 */

import { cookies, headers } from 'next/headers';
import { resolveCookieSecure } from '@/lib/cookie-secure';

export { resolveCookieSecure } from '@/lib/cookie-secure';

export const JWT_COOKIE = 'lr_strapi_jwt';
export const MEMBER_COOKIE = 'lr_strapi_member';

/** Matches the payload lifetime Users & Permissions issues by default (7d). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * `secure` is resolved per request: `x-forwarded-proto: https` (production
 * behind a TLS-terminating proxy) sets it automatically — see
 * `lib/cookie-secure.ts` — while `COOKIE_SECURE=true` stays the documented
 * override and plain http://localhost keeps it unset so browsers accept
 * the cookie. httpOnly and SameSite=Lax are always enforced.
 */
export async function requestCookieSecure(): Promise<boolean> {
  try {
    const h = await headers();
    return resolveCookieSecure(h.get('x-forwarded-proto'));
  } catch {
    // Headers unavailable in this execution scope: degrade to env-only
    // resolution (previous behavior), never break the login flow.
    return resolveCookieSecure(null);
  }
}

export async function sessionCookieOptions(): Promise<{
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
}> {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: await requestCookieSecure(),
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/** Display username of the logged-in member (or null). */
export async function getLoggedInUsername(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(MEMBER_COOKIE)?.value ?? null;
}
