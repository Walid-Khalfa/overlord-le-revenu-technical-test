/**
 * Data-access layer of the community.
 *
 * Every page/component reads data through these functions — never directly
 * from `mock-data.ts`. In Phase 4 the implementations are replaced by typed
 * `fetch` calls to the Strapi REST API and the signatures stay identical.
 *
 * An artificial latency makes the loading states observable during Phase 3.
 */

import { cache } from 'react';
import { CATEGORIES, DISCUSSIONS } from './mock-data';
import { MOCK_NOW } from './format';
import type { Category, Discussion, FeedResult, SortKey } from './types';

/** Simulated network latency (removed with the real API in Phase 4). */
const LATENCY_MS = 350;
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

/** Mockup “hot” score: activity, engagement and freshness. */
function hotScore(d: Discussion): number {
  const ageMin = (MOCK_NOW.getTime() - new Date(d.createdAt).getTime()) / 60_000;
  const lastReply = d.replies.reduce(
    (latest, r) => Math.max(latest, new Date(r.createdAt).getTime()),
    new Date(d.createdAt).getTime()
  );
  const lastMin = (MOCK_NOW.getTime() - lastReply) / 60_000;
  const score =
    (1 + d.replies.length * 3 + d.likes * 2 + d.views / 25) /
    Math.pow((ageMin + lastMin) / 120 + 2, 1.3);
  return score;
}

export const getCategories = cache(async (): Promise<Category[]> => {
  await delay();
  return CATEGORIES;
});

export const getFeed = cache(
  async ({ category, sort }: { category?: string; sort: SortKey }): Promise<FeedResult> => {
    await delay();
    const inCategory = DISCUSSIONS.filter((d) => !category || d.categorySlug === category);
    const unansweredCount = inCategory.filter((d) => d.replies.length === 0).length;
    const totals = {
      discussions: inCategory.length,
      replies: inCategory.reduce((sum, d) => sum + d.replies.length, 0),
    };

    let discussions: Discussion[];
    switch (sort) {
      case 'recent':
        discussions = [...inCategory].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        );
        break;
      case 'unanswered':
        discussions = inCategory
          .filter((d) => d.replies.length === 0)
          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case 'hot':
      default:
        discussions = [...inCategory].sort((a, b) => hotScore(b) - hotScore(a));
        break;
    }
    return { discussions, unansweredCount, totals };
  }
);

export const getDiscussion = cache(
  async (slug: string): Promise<Discussion | null> => {
    await delay();
    return DISCUSSIONS.find((d) => d.slug === slug) ?? null;
  }
);
