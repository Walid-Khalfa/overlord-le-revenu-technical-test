import Link from 'next/link';
import type { Category } from '@/lib/types';

/**
 * Horizontal category filter (mobile chip scroller of the mockup, also
 * rendered on desktop above the tabs). Every chip is a real link updating
 * the `?espace=` query param — this is the responsive category filter.
 * The row carries `id="espaces"`, the anchor targeted by the mobile
 * bottom-nav “Espaces” item.
 */
export function CategoryChips({
  categories,
  active,
}: {
  categories: Category[];
  active?: string;
}) {
  return (
    <nav className="cat-scroller" id="espaces" aria-label="Filtrer par espace">
      <Link className={`chip${active ? '' : ' on'}`} href="/" aria-current={active ? undefined : 'page'}>
        Tout
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          className={`chip${active === c.slug ? ' on' : ''}`}
          href={`/?espace=${encodeURIComponent(c.slug)}`}
          aria-current={active === c.slug ? 'page' : undefined}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
