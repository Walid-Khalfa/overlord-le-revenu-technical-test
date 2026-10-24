/**
 * Domain model of the community, shared by every component.
 *
 * The shape mirrors the Strapi content types implemented in Phase 2
 * (Category / Discussion / Reply + Users & Permissions user) — since Phase 4
 * every value is produced by the real Strapi REST API through the data
 * access layer (`lib/community.ts`), nothing is hardcoded any more.
 */

export type DiscussionType = 'question' | 'discussion';

/** Sort options of the feed (mockup tabs). */
export type SortKey = 'hot' | 'recent' | 'unanswered';

export interface Author {
  /** Stable identifier — the Strapi user id. */
  id: string;
  username: string;
  /** Rendered name: the member's username (only safe field exposed by the API). */
  displayName: string;
  /** Avatar gradient colour (mockup --av-* palette, derived from the username). */
  color: string;
}

export type CategoryIcon =
  | 'candles'
  | 'globe'
  | 'piggy'
  | 'umbrella'
  | 'building'
  | 'receipt'
  | 'armchair'
  | 'family'
  | 'gem'
  | 'wallet'
  | 'coffee';

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: CategoryIcon;
  color: string;
  /** Strapi documentId — used by the creation form to select the category. */
  documentId?: string;
}

export interface Reply {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  /** Unavailable on the current backend (bonus simplified) — undefined. */
  likes?: number;
  /** Render-time reference clock, captured inside the cached data scope. */
  now: string;
}

export interface Discussion {
  id: string;
  /** URL segment of the detail page — the Strapi documentId. */
  slug: string;
  title: string;
  content: string;
  type: DiscussionType;
  categorySlug: string;
  author: Author;
  createdAt: string;
  likes?: number;
  views?: number;
  /** Render-time reference clock, captured inside the cached data scope. */
  now: string;
  replies: Reply[];
}

/** Result of a feed query: the page plus counters used by the UI. */
export interface FeedResult {
  discussions: Discussion[];
  /** Discussions without any reply, inside the current category filter. */
  unansweredCount: number;
  /** Totals of the category filter, whatever the sort (for header stats). */
  totals: {
    discussions: number;
    replies: number;
  };
}
