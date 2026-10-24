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

import { cookies } from 'next/headers';

export const JWT_COOKIE = 'lr_strapi_jwt';
export const MEMBER_COOKIE = 'lr_strapi_member';

/** Matches the payload lifetime Users & Permissions issues by default (7d). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * `secure` stays opt-in: the demo runs on plain http://localhost, where a
 * secure cookie would never be sent. Set COOKIE_SECURE=true behind HTTPS.
 */
const secureCookie = process.env.COOKIE_SECURE === 'true';

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: secureCookie,
  path: '/',
  maxAge: SESSION_MAX_AGE,
});

/** Display username of the logged-in member (or null). */
export async function getLoggedInUsername(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(MEMBER_COOKIE)?.value ?? null;
}
