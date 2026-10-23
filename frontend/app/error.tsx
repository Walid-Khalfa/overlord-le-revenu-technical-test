'use client'; // Error boundaries must be Client Components

import { ErrorState } from '@/components/states';

/**
 * Route error boundary: renders the error state with a retry action.
 * `reset()` re-renders the segment (and re-runs the data layer).
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wrap">
      <div className="layout">
        <div className="side" aria-hidden="true" />
        <div className="main">
          <ErrorState onRetry={reset} />
          {error.digest ? (
            <p className="hint" style={{ textAlign: 'center' }}>
              Référence de l’erreur : {error.digest}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
