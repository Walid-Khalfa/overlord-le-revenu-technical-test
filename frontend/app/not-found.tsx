import Link from 'next/link';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/states';

export const metadata: Metadata = {
  title: 'Page introuvable',
};

/** 404 — unknown URL or unknown discussion slug (PDF: clean URLs stay safe). */
export default function NotFound() {
  return (
    <div className="wrap">
      <div className="layout">
        <div className="side" aria-hidden="true" />
        <div className="main">
          <EmptyState
            title="Page introuvable"
            message="Cette discussion n’existe pas ou a été retirée de la communauté."
            actionHref="/"
            actionLabel="Retour à l’accueil"
          />
          <p className="hint" style={{ textAlign: 'center' }}>
            <Link href="/publier">Publier une nouvelle discussion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
