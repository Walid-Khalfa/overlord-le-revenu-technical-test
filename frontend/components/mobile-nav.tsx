'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icons';

/**
 * Fixed bottom bar shown under 760px, like the mockup's `bnav`
 * (Accueil · Espaces · bouton central « Publier »). The bell/profile slots of
 * the mockup depend on authentication, which is out of this phase's scope.
 *
 * `usePathname` reads request-time state, so under `cacheComponents` the
 * layout renders the static `MobileNavFallback` first (identical items, no
 * active state) and the highlighted `MobileNav` streams in — see layout.tsx.
 */

function NavItems({ activePath }: { activePath: string | null }) {
  const onHome = activePath === '/';
  return (
    <>
      <Link
        className={`nav-item${onHome ? ' on' : ''}`}
        href="/"
        aria-current={onHome ? 'page' : undefined}
      >
        <Icon name="home" />
        Accueil
      </Link>
      <Link className="nav-item" href="/#espaces">
        <Icon name="grid" />
        Espaces
      </Link>
      <Link className="nav-item" href="/publier" aria-label="Publier une discussion">
        <span className="plus" aria-hidden="true">
          <Icon name="plus" />
        </span>
      </Link>
    </>
  );
}

/** Prerender-safe version: same items, no active highlighting. */
export function MobileNavFallback() {
  return (
    <nav className="bnav" aria-label="Navigation mobile">
      <NavItems activePath={null} />
    </nav>
  );
}

/** Full version: highlights Accueil using the current pathname. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="bnav" aria-label="Navigation mobile">
      <NavItems activePath={pathname} />
    </nav>
  );
}
