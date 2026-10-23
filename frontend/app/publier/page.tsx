import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import { DiscussionForm } from '@/components/discussion-form';
import { getCategories } from '@/lib/community';
import type { DiscussionType } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Publier une discussion',
};

/**
 * Creation page (PDF §2.C): type, title ≥ 10 chars, required content,
 * category. Client-side feedback mirrors the Strapi validation; the form
 * does not simulate a persisted publication (Phase 4 connects the API).
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
          les mêmes règles sont appliquées côté Strapi.
        </p>
      </header>
      <DiscussionForm categories={categories} initialType={initialType} />
    </Shell>
  );
}
