import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icons';
import { ReplyForm } from '@/components/reply-form';
import { MemberSection } from '@/components/member-section';
import { getCategories, getDiscussion } from '@/lib/community';
import { ago, fmtNum, fullDate, replyCountLabel } from '@/lib/format';

/**
 * Discussion detail (PDF §2.B) — Phase 4: each discussion lives at its own
 * clean URL `/discussions/<documentId>`, straight from the real Strapi API:
 * title, content, author, publication date, category and the replies list,
 * plus the reply form (persisted by the `createReply` server action).
 *
 * Detail URLs are only known from Strapi (documentId ids), so this route
 * renders in blocking mode instead of an instant URL-predefined shell.
 */

export const instant = false;

export async function generateMetadata(
  props: PageProps<'/discussions/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params;
  const discussion = await getDiscussion(decodeURIComponent(slug));
  if (!discussion) {
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
              <time dateTime={discussion.createdAt} title={`Publié ${ago(discussion.createdAt, discussion.now)}`}>
                Publié le {fullDate(discussion.createdAt)}
              </time>
              {discussion.views != null ? (
                <>
                  {' · '}
                  <span className="num">{fmtNum(discussion.views)}</span> vues
                </>
              ) : null}
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
                    {ago(reply.createdAt, discussion.now)}
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

        <MemberSection />

        <ReplyForm
          discussionAuthorName={discussion.author.displayName}
          discussionType={discussion.type}
          discussionId={discussion.id}
        />
      </section>
    </Shell>
  );
}
