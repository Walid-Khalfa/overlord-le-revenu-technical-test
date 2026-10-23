import Link from 'next/link';
import { Icon } from './icons';

const SITE = 'https://www.lerevenu.com';
const SITE_NAV = ['Bourse', 'Économie', 'Placements', 'Immobilier', 'Impôts', 'Succession', 'Vie pratique'];

/**
 * Top chrome of the community: the thin bar linking to lerevenu.com and the
 * sticky header (reconstituted logo + “Communauté” + publish CTA), ported
 * from the mockup. The search field and account menus of the mockup belong to
 * features outside this assessment's scope and are intentionally omitted.
 */
export function SiteHeader() {
  return (
    <>
      <div className="sitebar">
        <div className="wrap">
          <a className="sb-back" href={SITE} target="_blank" rel="noopener noreferrer">
            <Icon name="arrowL" />
            Retour sur lerevenu.com
          </a>
          <nav className="sb-links" aria-label="Rubriques de lerevenu.com">
            {SITE_NAV.map((r) => (
              <a key={r} href={SITE} target="_blank" rel="noopener noreferrer">
                {r}
              </a>
            ))}
          </nav>
          <span className="sb-right">
            <a href={SITE} target="_blank" rel="noopener noreferrer">
              <Icon name="external" />
              Le magazine
            </a>
            <a className="sb-sub" href={SITE} target="_blank" rel="noopener noreferrer">
              S&apos;abonner
            </a>
          </span>
        </div>
      </div>

      <header className="hdr">
        <div className="wrap hdr-in">
          <Link className="brand" href="/" aria-label="Le Revenu, accueil de la communauté">
            <span className="lr-logo" aria-hidden="true">
              <span className="lr-le">LE</span>
              <span>REVENU</span>
            </span>
            <span className="brand-sep" aria-hidden="true" />
            <span className="brand-sub">Communauté</span>
          </Link>
          <div className="hdr-act">
            <Link className="btn btn-primary hdr-compose" href="/publier">
              <Icon name="plus" />
              Publier
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
