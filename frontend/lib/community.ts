/**
 * Data-access layer of the community (Phase 4 — real Strapi REST API).
 *
 * Every page/component reads data through these functions — never directly
 * from a hardcoded dataset (PDF §2.A). Reads are cached by Next.js
 * (`use cache` + `cacheTag('community')`); the write server actions call
 * `updateTag('community')` so a new discussion/reply is reflected immediately.
 *
 * Caching note (Cache Components): public reads are safe to share between
 * visitors; session-dependent code lives in `lib/auth.ts` and server actions,
 * never in a plain `use cache` scope.
 */

import { cacheLife, cacheTag } from 'next/cache';
import {
  strapiRequest,
  StrapiApiError,
  type StrapiCategoryJson,
  type StrapiDiscussionJson,
  type StrapiReplyJson,
  type StrapiUserRef,
  type StrapiList,
} from './strapi';
import type {
  Author,
  Category,
  CategoryIcon,
  Discussion,
  DiscussionType,
  FeedResult,
  Reply,
  SortKey,
} from './types';

/** Segment of the Strapi list endpoint used for a feed page. */
const FEED_PAGE_SIZE = 25;

/* ------------------------- presentation presentation ----------------------- */

/** Palette under the mockup's avatar gradient tone (--av-*). */
const AVATAR_COLORS = [
  '#007aff', '#3d5a80', '#34c759', '#30b0c7', '#ff9500', '#5856d6',
  '#ff2d55', '#af52de', '#00c7be', '#8e8e93', '#a2845e',
];

const CATEGORY_LOOK: Record<string, { icon: CategoryIcon; color: string }> = {
  bourse: { icon: 'candles', color: '#007aff' },
  economie: { icon: 'globe', color: '#3d5a80' },
  epargne: { icon: 'piggy', color: '#34c759' },
  'assurance-vie': { icon: 'umbrella', color: '#30b0c7' },
  immobilier: { icon: 'building', color: '#ff9500' },
  impots: { icon: 'receipt', color: '#5856d6' },
  retraite: { icon: 'armchair', color: '#ff2d55' },
  transmission: { icon: 'family', color: '#af52de' },
  alternatifs: { icon: 'gem', color: '#00c7be' },
  budget: { icon: 'wallet', color: '#8e8e93' },
  cafe: { icon: 'coffee', color: '#a2845e' },
};

const FALLBACK_LOOK = CATEGORY_LOOK.budget;

function lookFor(slug: string): { icon: CategoryIcon; color: string } {
  return CATEGORY_LOOK[slug] ?? FALLBACK_LOOK;
}

/** Deterministic avatar colour for a username (mockup visual identity). */
function avatarColor(username: string): string {
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function mapAuthor(user?: StrapiUserRef | null): Author {
  const username = user?.username ?? 'membre';
  return {
    id: String(user?.id ?? username),
    username,
    displayName: username,
    color: avatarColor(username),
  };
}

function mapCategory(raw: StrapiCategoryJson): Category {
  const look = lookFor(raw.slug);
  return {
    slug: raw.slug,
    documentId: raw.documentId,
    name: raw.name,
    description: raw.description ?? '',
    icon: look.icon,
    color: look.color,
  };
}

function mapDiscussion(raw: StrapiDiscussionJson): Discussion {
  // Time reference captured inside the `use cache` scope: relative dates
  // render from cache-stable clock values (Cache Components requirement).
  const now = new Date().toISOString();
  const replies: Reply[] = (raw.replies ?? []).map((r) => ({
    id: r.documentId,
    content: r.content,
    author: mapAuthor(r.author),
    createdAt: r.createdAt,
    likes: undefined,
    now,
  }));
  return {
    id: raw.documentId,
    slug: raw.documentId,
    title: raw.title,
    content: raw.content,
    type: raw.type,
    categorySlug: raw.category?.slug ?? '',
    author: mapAuthor(raw.author),
    createdAt: raw.createdAt,
    likes: undefined,
    views: undefined,
    now,
    replies,
  };
}

/* --------------------------------- reads ---------------------------------- */

/** Thematic spaces of the community (used by the sidebar, chips and forms). */
export async function getCategories(): Promise<Category[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('community');

  const list = await strapiRequest<StrapiList<StrapiCategoryJson>>('/api/categories');
  return (list.data ?? []).map(mapCategory);
}

/**
 * Feed of discussions straight from Strapi:
 * - category filter is executed by the backend (`filters[category][slug]`);
 * - base ordering is executed by the backend (`sort[0]=createdAt:desc`);
 * - pagination comes from the backend envelope.
 *
 * The mockup's « Tendances » (activity)` and « Sans réponse » tabs are then
 * presentational refinements derived from the populated replies of the page —
 * Strapi v5 has no native relation-count sort/filter, and the remainder of
 * this behaviour could become a dedicated backend endpoint in a future phase.
 */
export async function getFeed({
  category,
  sort,
}: {
  category?: string;
  sort: SortKey;
}): Promise<FeedResult> {
  'use cache';
  cacheLife('minutes');
  cacheTag('community');

  const params = new URLSearchParams();
  params.set('sort[0]', 'createdAt:desc');
  params.set('pagination[pageSize]', String(FEED_PAGE_SIZE));
  if (category) params.set('filters[category][slug][$eq]', category);

  const list = await strapiRequest<StrapiList<StrapiDiscussionJson>>(
    `/api/discussions?${params.toString()}`
  );
  const discussions = (list.data ?? []).map(mapDiscussion);

  const totals = {
    discussions: list.meta?.pagination?.total ?? discussions.length,
    replies: discussions.reduce((sum, d) => sum + d.replies.length, 0),
  };
  const unanswered = discussions.filter((d) => d.replies.length === 0);

  switch (sort) {
    case 'unanswered':
      // Oldest questions first (mockup order) — base fetch is already backend-sorted.
      unanswered.reverse();
      return { discussions: unanswered, unansweredCount: unanswered.length, totals };
    case 'hot':
      return {
        discussions: [...discussions].sort(
          (a, b) => b.replies.length - a.replies.length || +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
        unansweredCount: unanswered.length,
        totals,
      };
    case 'recent':
    default:
      return { discussions, unansweredCount: unanswered.length, totals };
  }
}

/**
 * One discussion by URL segment (its Strapi documentId).
 * Returns `null` for an unknown id — the route maps it to `notFound()`.
 */
export async function getDiscussion(slug: string): Promise<Discussion | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('community');

  try {
    // The custom REST controller keeps the standard `{ data: ... }` envelope.
    const payload = await strapiRequest<{ data?: StrapiDiscussionJson }>(
      `/api/discussions/${encodeURIComponent(slug)}`
    );
    return payload.data ? mapDiscussion(payload.data) : null;
  } catch (err) {
    if (err instanceof StrapiApiError && err.status === 404) return null;
    throw err;
  }
}

/* -------------------------------- mutations ------------------------------- */
/* Plain (uncached) helpers consumed by the server actions of app/actions/.   */

export interface DemoLogin {
  jwt: string;
  username: string;
}

/** Login through the native Users & Permissions endpoint. */
export async function login(identifier: string, password: string): Promise<DemoLogin> {
  const payload = await strapiRequest<{
    jwt: string;
    user: StrapiUserRef;
  }>('/api/auth/local', {
    method: 'POST',
    body: { identifier, password },
  });
  if (!payload.jwt || !payload.user?.username) {
    throw new StrapiApiError(401, 'UnauthorizedError', 'Identifiants invalides.', []);
  }
  return { jwt: payload.jwt, username: payload.user.username };
}

export interface NewDiscussionInput {
  title: string;
  content: string;
  type: DiscussionType;
  /** Category documentId (the form value). */
  category: string;
}

/**
 * Create a discussion as the logged-in member.
 * The backend always overrides the author from the JWT — a client can never
 * publish on behalf of someone else (PDF §2.D).
 */
export async function createDiscussion(jwt: string, input: NewDiscussionInput): Promise<StrapiDiscussionJson> {
  const payload = await strapiRequest<{ data: StrapiDiscussionJson }>('/api/discussions', {
    method: 'POST',
    jwt,
    body: { data: input },
    timeoutMs: 20_000,
  });
  return payload.data;
}

/**
 * Post a reply in an existing discussion as the logged-in member.
 * Same guarantee: the reply author is the session user.
 */
export async function createReply(
  jwt: string,
  input: { content: string; discussion: string }
): Promise<StrapiReplyJson> {
  const payload = await strapiRequest<{ data: StrapiReplyJson }>('/api/replies', {
    method: 'POST',
    jwt,
    body: { data: input },
    timeoutMs: 20_000,
  });
  return payload.data;
}
