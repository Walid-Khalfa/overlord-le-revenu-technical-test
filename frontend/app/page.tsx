import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Shell } from '@/components/shell';
import { CategoryChips } from '@/components/category-chips';
import { SortTabs } from '@/components/sort-tabs';
import { DiscussionCard } from '@/components/discussion-card';
import { EmptyState } from '@/components/states';
import { Icon } from '@/components/icons';
import { MemberSection } from '@/components/member-section';
import { getCategories, getFeed } from '@/lib/community';
import type { Category, SortKey } from '@/lib/types';

/**
 * Community home (PDF §2.A): discussions from the data layer with category
 * filtering (`?espace=`) and sorting (`?tri=`), quick publish entry points
 * and the mockup's visual structure (hero, quick composer, chips, tabs, feed).
 */

function Hero() {
  return (
    <section className="hero">
      <div>
        <h1>La communauté des lecteurs du Revenu</h1>
        <p>
          Posez vos questions d&apos;argent, partagez vos expériences et échangez avec
          la rédaction. Bourse, épargne, impôts, retraite, transmission.
        </p>
        <div className="hero-stats">
          <span>
            <b className="num">4 812</b>
            membres
          </span>
          <span>
            <b className="num">1 808</b>
            discussions
          </span>
          <span>
            <b className="num">13 700</b>
            réponses
          </span>
          <span>
            <b className="num">94 %</b>
            des questions résolues
          </span>
        </div>
      </div>
      <div className="hero-cta">
        <Link className="btn btn-primary" href="/publier">
          Publier une discussion
        </Link>
        <a className="btn btn-quiet" href="#espaces">
          Explorer les espaces
        </a>
      </div>
    </section>
  );
}

function QuickComposer() {
  return (
    <div className="quick" role="group" aria-label="Publier">
      <span
        className="av av-md"
        style={{ '--c': 'var(--ink-3)' } as CSSProperties}
        aria-hidden="true"
      >
        <Icon name="user" />
      </span>
      <Link className="quick-input" href="/publier">
        Posez votre question à la communauté…
      </Link>
      <div className="quick-types">
        <Link className="quick-type" href="/publier?type=question">
          <Icon name="help" />
          Question
        </Link>
        <Link className="quick-type" href="/publier?type=discussion">
          <Icon name="msg" />
          Discussion
        </Link>
      </div>
    </div>
  );
}

function CategoryHeader({
  category,
  totals,
}: {
  category: Category;
  totals: { discussions: number; replies: number };
}) {
  return (
    <section className="cat-head">
      <span
        className="sp-ic lg"
        style={{ '--c': category.color } as CSSProperties}
        aria-hidden="true"
      >
        <Icon name={category.icon} />
      </span>
      <div className="grow">
        <h1>{category.name}</h1>
        <p>{category.description}</p>
        <div className="stats">
          <span>
            <b className="num">{totals.discussions}</b> discussions
          </span>
          <span>
            <b className="num">{totals.replies}</b> réponses
          </span>
        </div>
      </div>
      <Link className="btn btn-primary" href="/publier">
        <Icon name="plus" />
        Publier ici
      </Link>
    </section>
  );
}

export default async function HomePage(props: PageProps<'/'>) {
  const searchParams = await props.searchParams;
  const rawCategory = typeof searchParams.espace === 'string' ? searchParams.espace : undefined;
  const rawSort = typeof searchParams.tri === 'string' ? searchParams.tri : undefined;
  const sort: SortKey = rawSort === 'recent' || rawSort === 'unanswered' ? rawSort : 'hot';

  const categories = await getCategories();
  const activeCategory = categories.find((c) => c.slug === rawCategory);
  const categorySlug = activeCategory?.slug;
  const { discussions, unansweredCount, totals } = await getFeed({
    category: categorySlug,
    sort,
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  return (
    <Shell categories={categories} activeCategory={categorySlug}>
      {activeCategory ? (
        <CategoryHeader category={activeCategory} totals={totals} />
      ) : (
        <Hero />
      )}
      <QuickComposer />
      <MemberSection />
      <CategoryChips categories={categories} active={categorySlug} />
      <SortTabs sort={sort} unansweredCount={unansweredCount} category={categorySlug} />

      {discussions.length > 0 ? (
        <div className="feed">
          {discussions.map((d) => (
            <DiscussionCard
              key={d.id}
              discussion={d}
              category={categoryBySlug.get(d.categorySlug)}
            />
          ))}
        </div>
      ) : sort === 'unanswered' ? (
        <EmptyState
          title="Toutes les questions ont une réponse"
          message="Bravo à la communauté ! Revenez plus tard ou posez à votre tour une question."
          actionHref="/publier?type=question"
          actionLabel="Poser une question"
        />
      ) : (
        <EmptyState
          title="Rien ici pour l’instant"
          message="Lancez la première discussion de cet espace."
          actionHref="/publier"
          actionLabel="Publier"
        />
      )}
    </Shell>
  );
}
