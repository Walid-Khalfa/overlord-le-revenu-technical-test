import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import { DiscussionForm } from '@/components/discussion-form';
import { getCategories } from '@/lib/community';
import { MemberSection } from '@/components/member-section';
import type { DiscussionType } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Publier une discussion',
};

/**
 * Creation page (PDF §2.C) — Phase 4: type, title ≥ 10 chars, required
 * content, category. The form posts through the `createDiscussion` server
 * action to the real Strapi API; the backend re-validates everything and
 * the author always comes from the session, then the browser is redirected
 * to the created discussion.
 */
export default async function NewDiscussionPage(props: PageProps<'/publier'>) {
  const searchParams = await props.searchParams;
  const initialType: DiscussionType =
    searchParams.type === 'discussion' ? 'discussion' : 'question';

  const categories = await getCategories();

  return (
    <Shell categories={categories}>
      <header className="page-head">
        <h1>Nouvelle discussion</h1>
        <p>
          Posez une question ou lancez une discussion avec la communauté. Titre de
          10 caractères minimum, contenu obligatoire, espace et type à choisir —
          les mêmes règles sont appliquées côté Strapi. Les publications
          nécessitent une connexion membre.
        </p>
      </header>
      <MemberSection />
      <DiscussionForm categories={categories} initialType={initialType} />
    </Shell>
  );
}
