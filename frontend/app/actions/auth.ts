'use server';

/**
 * Authentication server actions (Phase 4 — minimal secure Strapi session).
 *
 * The raw password only transits between the demo member's browser and this
 * server action (HTTPS-equivalent on localhost); the issued JWT is kept in an
 * httpOnly cookie and never echoed back to the client.
 */

import { cookies } from 'next/headers';
import { login } from '@/lib/community';
import { JWT_COOKIE, MEMBER_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';

export interface AuthFormState {
  ok?: boolean;
  username?: string;
  error?: string;
}

const secureCookie = process.env.COOKIE_SECURE === 'true';

const loginCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: secureCookie,
  path: '/',
  maxAge: SESSION_MAX_AGE,
});

/** Login with a demo member's username + password. */
export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const identifier = String(formData.get('identifier') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!identifier || !password) {
    return { error: 'Renseignez votre identifiant et votre mot de passe.' };
  }

  let jwt: string;
  let username: string;
  try {
    const session = await login(identifier, password);
    jwt = session.jwt;
    username = session.username;
  } catch (err) {
    if (err instanceof Error && err.name === 'StrapiApiError') {
      return { error: 'Identifiants incorrects.' };
    }
    return { error: 'Connexion impossible pour le moment — réessayez.' };
  }

  const jar = await cookies();
  jar.set(JWT_COOKIE, jwt, loginCookieOptions());
  jar.set(MEMBER_COOKIE, username, loginCookieOptions());

  // Mutating a cookie re-renders the current route inside the action
  // response: the member panel switches to its connected view immediately.
  return { ok: true, username };
}

/** Log out: both session cookies are dropped. */
export async function logoutAction(): Promise<AuthFormState> {
  const jar = await cookies();
  jar.delete(JWT_COOKIE);
  jar.delete(MEMBER_COOKIE);
  return { ok: true };
}
