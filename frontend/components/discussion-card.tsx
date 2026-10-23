import Link from 'next/link';
import { Avatar } from './avatar';
import { Icon } from './icons';
import { ago, fmtNum, fullDate } from '@/lib/format';
import type { Category, Discussion } from '@/lib/types';

/**
 * Discussion card of the feed — ported from the mockup `topicCard()`:
 * reply-count tile (dashed red when there is none), category + type tags,
 * Playfair title, two-line excerpt, byline with relative date, participants
 * stack and engagement stats.
 *
 * The whole card links to the detail page (the title is the accessible
 * label); category navigation lives in the sidebar and the chip scroller.
 */
export function DiscussionCard({
  discussion,
  category,
}: {
  discussion: Discussion;
  category?: Category;
}) {
  const n = discussion.replies.length;
  const participants = [
    ...new Map(discussion.replies.map((r) => [r.author.id, r.author])).values(),
  ].slice(0, 4);

  return (
    <article className="tcard">
      <div>
        <span className={`tcount${n ? '' : ' zero'}`}>
          <b className="num">{n}</b>
          <span>{n === 1 ? 'réponse' : 'réponses'}</span>
        </span>
      </div>
      <div>
        <div className="tmeta">
          {category ? <span className="cat-tag">{category.name}</span> : null}
          {discussion.type === 'question' ? (
            <span className="tag tag-q">
              <Icon name="help" />
              Question
            </span>
          ) : null}
        </div>
        <h3 className="ttitle">
          <Link href={`/discussions/${encodeURIComponent(discussion.slug)}`}>
            {discussion.title}
          </Link>
        </h3>
        <p className="texcerpt">{discussion.content.replace(/\n+/g, ' ')}</p>
        <div className="tfoot">
          <span className="byline">
            <Avatar author={discussion.author} size="xs" />
            <b>{discussion.author.displayName}</b>
            <time dateTime={discussion.createdAt} title={fullDate(discussion.createdAt)}>
              {'· '}
              {ago(discussion.createdAt)}
            </time>
          </span>
          <span className="tstats">
            {participants.length > 0 ? (
              <span className="stack" aria-hidden="true">
                {participants.map((a) => (
                  <Avatar key={a.id} author={a} size="xs" />
                ))}
              </span>
            ) : null}
            <span title="Utile">
              <Icon name="thumb" />
              <span className="num">{fmtNum(discussion.likes)}</span>
            </span>
            <span className="views" title="Vues">
              <Icon name="eye" />
              <span className="num">{fmtNum(discussion.views)}</span>
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
