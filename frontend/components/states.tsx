import Link from 'next/link';

/**
 * Loading, empty and error state components required by the assessment.
 * Visual language stays inside the mockup (`.empty`, `.card`, brand buttons);
 * skeletons extend the design system with a neutral pulse placeholder.
 */

export function FeedSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="sk" style={{ height: 190, borderRadius: 18 }} />
      <div className="sk" style={{ height: 58, borderRadius: 14 }} />
      <div className="sk" style={{ height: 38, width: 340, maxWidth: '100%', borderRadius: 10 }} />
      <div className="feed">
        {[0, 1, 2].map((i) => (
          <div key={i} className="tcard" style={{ cursor: 'default' }}>
            <div>
              <div className="sk" style={{ width: 62, height: 58, borderRadius: 9 }} />
            </div>
            <div>
              <div className="sk" style={{ height: 12, width: '32%', marginBottom: 9 }} />
              <div className="sk" style={{ height: 20, width: '78%', marginBottom: 9 }} />
              <div className="sk" style={{ height: 14, width: '58%' }} />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        Chargement des discussions…
      </span>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="sk" style={{ height: 30, width: 340, maxWidth: '100%', marginBottom: 8 }} />
      <div className="sk" style={{ height: 18, width: 480, maxWidth: '100%', marginBottom: 18 }} />
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="sk" style={{ height: 76, borderRadius: 12 }} />
        <div className="sk" style={{ height: 40 }} />
        <div className="sk" style={{ height: 40 }} />
        <div className="sk" style={{ height: 130 }} />
        <div className="sk" style={{ height: 36, width: 160, borderRadius: 10 }} />
      </div>
      <span className="sr-only" role="status">
        Chargement du formulaire…
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="feed">
      <div className="empty">
        <h3>{title}</h3>
        <p>{message}</p>
        {actionHref && actionLabel ? (
          <Link className="btn btn-primary" href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="feed">
      <div className="empty" role="alert">
        <h3>Une erreur est survenue</h3>
        <p>
          Les discussions n&apos;ont pas pu être chargées. Vérifiez votre
          connexion puis réessayez.
        </p>
        <button className="btn btn-primary" type="button" onClick={onRetry}>
          Réessayer
        </button>
      </div>
    </div>
  );
}

/**
 * Frame shared by loading/error screens: same two-column shell as the real
 * pages (sidebar placeholder + main column) so nothing jumps on swap.
 */
export function LoadingFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap">
      <div className="layout">
        <div className="side" aria-hidden="true">
          <div className="sk" style={{ height: 34, marginBottom: 8 }} />
          <div className="sk" style={{ height: 34, marginBottom: 8 }} />
          <div className="sk" style={{ height: 34, marginBottom: 8 }} />
          <div className="sk" style={{ height: 34 }} />
        </div>
        <div className="main">{children}</div>
      </div>
    </div>
  );
}
