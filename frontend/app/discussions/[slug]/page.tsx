import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icons';
import { ReplyForm } from '@/components/reply-form';
import { getCategories, getDiscussion, getFeed } from '@/lib/community';
import { ago, fmtNum, fullDate, replyCountLabel } from '@/lib/format';

/**
 * Discussion detail (PDF §2.B): clean URL per discussion, title, content,
 * author, publication date, category and the replies list, plus the reply
 * form (client-side validation; persistence arrives in Phase 4).
 */

// Prerender the six known mock discussions at build time; unknown slugs are
// intercepted earlier by proxy.ts so the router can answer a real 404.

/** Prerender every known mock discussion at build time. */
export async function generateStaticParams() {
  const { discussions } = await getFeed({ sort: 'hot' });
  return discussions.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(
  props: PageProps<'/discussions/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params;
  const discussion = await getDiscussion(decodeURIComponent(slug));
  if (!discussion) {
    // Safety net: proxy.ts already intercepts unknown slugs before render.
    return { title: 'Discussion introuvable' };
  }
  return {
    title: discussion.title,
    description: discussion.content.slice(0, 160),
  };
}

const paragraphs = (text: string) => text.split(/\n{2,}/).filter(Boolean);

export default async function DiscussionPage(props: PageProps<'/discussions/[slug]'>) {
  const { slug } = await props.params;
  const discussion = await getDiscussion(decodeURIComponent(slug));
  if (!discussion) notFound();

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === discussion.categorySlug);
  const replyCount = discussion.replies.length;

  return (
    <Shell categories={categories} activeCategory={discussion.categorySlug}>
      <nav className="crumbs" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link>
        <Icon name="chev" />
        {category ? (
          <Link href={`/?espace=${encodeURIComponent(category.slug)}`}>{category.name}</Link>
        ) : null}
      </nav>

      <article className="post post-main">
        <div className="tmeta">
          {category ? <span className="cat-tag">{category.name}</span> : null}
          {discussion.type === 'question' ? (
            <span className="tag tag-q">
              <Icon name="help" />
              Question
            </span>
          ) : null}
        </div>
        <h1>{discussion.title}</h1>
        <div className="author">
          <Avatar author={discussion.author} size="md" />
          <div>
            <div className="author-name">{discussion.author.displayName}</div>
            <div className="author-sub">
              <time dateTime={discussion.createdAt} title={`Publié ${ago(discussion.createdAt)}`}>
                Publié le {fullDate(discussion.createdAt)}
              </time>
              {' · '}
              <span className="num">{fmtNum(discussion.views)}</span> vues
            </div>
          </div>
        </div>
        <div className="prose">
          {paragraphs(discussion.content).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>

      <section className="replies" aria-label="Réponses">
        <h2 className="section-title">
          {replyCount ? replyCountLabel(replyCount) : 'Aucune réponse pour l’instant'}
        </h2>

        {discussion.replies.map((reply) => (
          <article className="post reply" key={reply.id}>
            <div className="author">
              <Avatar author={reply.author} size="sm" />
              <div>
                <div className="author-name">{reply.author.displayName}</div>
                <div className="author-sub">
                  <time dateTime={reply.createdAt} title={`Publié le ${fullDate(reply.createdAt)}`}>
                    {ago(reply.createdAt)}
                  </time>
                </div>
              </div>
            </div>
            <div className="prose">
              {paragraphs(reply.content).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
        ))}

        <ReplyForm
          discussionAuthorName={discussion.author.displayName}
          discussionType={discussion.type}
        />
      </section>
    </Shell>
  );
}
