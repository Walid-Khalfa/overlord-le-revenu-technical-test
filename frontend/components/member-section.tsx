import { Suspense } from 'react';
import { getLoggedInUsername } from '@/lib/auth';
import { MemberForm } from './member-form';

/**
 * Espace membre (Server Component) — session access is request-time under
 * Cache Components, so the section sits behind a Suspense boundary and
 * streams in after the static shell.
 */
export function MemberSection() {
  return (
    <Suspense fallback={<section className="member card muted" aria-hidden="true">Espace membre…</section>}>
      <MemberPanel />
    </Suspense>
  );
}

async function MemberPanel() {
  const username = await getLoggedInUsername();
  return (
    <section className="member card" aria-label="Espace membre">
      <MemberForm username={username} />
    </section>
  );
}
