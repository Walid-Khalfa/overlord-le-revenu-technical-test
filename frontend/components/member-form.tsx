'use client';

import { useActionState } from 'react';
import { loginAction, logoutAction, type AuthFormState } from '@/app/actions/auth';
import { Icon } from './icons';

const initialAuthState: AuthFormState = {};

/**
 * Member space (Client Component) — top of the sidebar content area:
 * - logged out: compact login form (Users & Permissions /auth/local) with the
 *   demo account hint (passwords live in the backend seed, never displayed);
 * - logged in: the session username (read from the httpOnly server-side
 *   cookie by the parent Server Component) + logout.
 */
export function MemberForm({ username }: { username: string | null }) {
  const [authState, authSubmit, authPending] = useActionState(loginAction, initialAuthState);
  const [, outSubmit, outPending] = useActionState(logoutAction, initialAuthState);

  if (username) {
    return (
      <div className="member" data-testid="member-connected">
        <Icon name="user" />
        <div className="grow">
          <b>{username}</b>
          <span className="hint" id="member-hint">
            Connecté — vous pouvez publier et répondre.
          </span>
        </div>
        <form action={outSubmit}>
          <button className="btn btn-quiet" type="submit" disabled={outPending}>
            <Icon name="arrowL" />
            Se déconnecter
          </button>
        </form>
      </div>
    );
  }

  return (
    <form className="member" action={authSubmit} data-testid="member-login">
      <div className="grow">
        <label className="field-inline" htmlFor="member-id">
          <span className="sr-only">Espace membre</span>
          <input
            className="input"
            id="member-id"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="Identifiant (démo : demo_marie…)"
            aria-invalid={authState.error ? true : undefined}
            aria-describedby={authState.error ? 'member-err' : undefined}
          />
          <input
            className="input"
            id="member-pass"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe"
            aria-invalid={authState.error ? true : undefined}
            aria-describedby={authState.error ? 'member-err' : undefined}
          />
        </label>
        {authState.error ? (
          <span className="err-msg" id="member-err" role="alert">
            {authState.error}
          </span>
        ) : (
          <span className="hint">
            Démo : demo_marie · demo_paul · demo_sophie — mot de passe défini au seed (voir backend).
          </span>
        )}
      </div>
      <button className="btn btn-quiet" type="submit" disabled={authPending}>
        <Icon name="user" />
        {authPending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
