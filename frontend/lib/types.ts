/**
 * Domain model of the community, shared by every component.
 *
 * The shape mirrors the Strapi content types implemented in Phase 2
 * (Category / Discussion / Reply + Users & Permissions user) so the mock
 * layer can be swapped for real API calls in Phase 4 without touching the UI.
 */

export type DiscussionType = 'question' | 'discussion';

/** Sort options of the feed (mockup tabs). */
export type SortKey = 'hot' | 'recent' | 'unanswered';

export interface Author {
  /** Stable identifier — will map to the Strapi user id / documentId. */
  id: string;
  username: string;
  displayName: string;
  /** Avatar gradient colour (mockup --av-* palette). */
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
}

export interface Reply {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  likes: number;
}

export interface Discussion {
  id: string;
  /** Clean, human-readable URL segment (PDF: “Créer une URL propre”). */
  slug: string;
  title: string;
  content: string;
  type: DiscussionType;
  categorySlug: string;
  author: Author;
  createdAt: string;
  likes: number;
  views: number;
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
