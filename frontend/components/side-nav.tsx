import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Icon } from './icons';
import type { Category } from '@/lib/types';

/**
 * Desktop sidebar: Accueil + the eleven thematic spaces, used as the
 * category filter (each link points to `/?espace=slug`).
 * `activeCategory` is highlighted, exactly like the mockup's `sideNav()`.
 */
export function SideNav({
  categories,
  activeCategory,
}: {
  categories: Category[];
  activeCategory?: string;
}) {
  return (
    <nav className="side" aria-label="Navigation principale">
      <Link className={`nav-link${activeCategory ? '' : ' on'}`} href="/" aria-current={activeCategory ? undefined : 'page'}>
        <Icon name="home" />
        Accueil
      </Link>
      <div className="nav-title">Espaces</div>
      {categories.map((c) => (
        <Link
          key={c.slug}
          className={`nav-link${activeCategory === c.slug ? ' on' : ''}`}
          href={`/?espace=${encodeURIComponent(c.slug)}`}
          aria-current={activeCategory === c.slug ? 'page' : undefined}
        >
          <span className="sp-ic" aria-hidden="true" style={{ '--c': c.color } as CSSProperties}>
            <Icon name={c.icon} />
          </span>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
