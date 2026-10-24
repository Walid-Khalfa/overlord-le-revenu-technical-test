'use server';

/**
 * Community write actions (Phase 4) — publication of discussions and replies
 * through the real Strapi API, on behalf of the httpOnly session cookie.
 *
 * The backend stays authoritative: Strapi validates the payload again
 * server-side (title length, required fields, type, existing category) and
 * the author ALWAYS comes from the JWT, so a client can never publish on
 * behalf of another member (PDF §2.C/§2.D).
 */

import { cookies } from 'next/headers';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { StrapiApiError } from '@/lib/strapi';
import { createDiscussion, createReply } from '@/lib/community';
import { JWT_COOKIE } from '@/lib/auth';
import type { DiscussionType } from '@/lib/types';

const COMMUNITY_TAG = 'community';

export interface DiscussionFormState {
  ok?: boolean;
  /** Per-field errors (client renderer + Strapi 400 responses). */
  fieldErrors?: Record<string, string>;
  /** Non-field failure reasons (not logged in, Strapi down…). */
  formError?: string;
}

export interface ReplyFormState {
  ok?: boolean;
  formError?: string;
}

const communityCookie = () => cookies();

function fieldErrorsFrom(err: StrapiApiError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const fe of err.fieldErrors) out[fe.field] = fe.message;
  return out;
}

function authMessage(): { unauthenticated: boolean; formError: string } {
  return {
    unauthenticated: true,
    formError: "Connectez-vous dans l'espace membre ci-dessus pour publier.",
  };
}

/** Create a discussion, then redirect to its own page (PDF §2.C). */
export async function createDiscussionAction(
  _prev: DiscussionFormState,
  formData: FormData
): Promise<DiscussionFormState> {
  const jwt = (await communityCookie()).get(JWT_COOKIE)?.value;
  if (!jwt) return authMessage();

  const title = String(formData.get('title') ?? '');
  const content = String(formData.get('content') ?? '');
  const type: DiscussionType = formData.get('type') === 'discussion' ? 'discussion' : 'question';
  const category = String(formData.get('category') ?? '');

  let documentId: string;
  try {
    const created = await createDiscussion(jwt, { title, content, type, category });
    documentId = created.documentId;
  } catch (err) {
    if (err instanceof StrapiApiError) {
      if (err.status === 401 || err.status === 403) return authMessage();
      return { formError: undefined, fieldErrors: fieldErrorsFrom(err) };
    }
    return { formError: 'Publication impossible pour le moment — réessayez.' };
  }

  // Read-your-own-writes: the redirect target and every feed listing it
  // touches must include the freshly created discussion.
  updateTag(COMMUNITY_TAG);
  redirect(`/discussions/${encodeURIComponent(documentId)}`);
}

/** Post a reply in an existing discussion (PDF §2.B). */
export async function createReplyAction(
  _prev: ReplyFormState,
  formData: FormData
): Promise<ReplyFormState> {
  const jwt = (await communityCookie()).get(JWT_COOKIE)?.value;
  if (!jwt) return authMessage();

  const discussionId = String(formData.get('discussionId') ?? '');
  const content = String(formData.get('content') ?? '');
  if (!discussionId) return { formError: 'Discussion introuvable.' };

  try {
    await createReply(jwt, { content, discussion: discussionId });
  } catch (err) {
    if (err instanceof StrapiApiError) {
      if (err.status === 401 || err.status === 403) return authMessage();
      const fields = fieldErrorsFrom(err);
      const message = fields['content'] ?? 'Réponse invalide.';
      return { formError: message };
    }
    return { formError: 'Réponse impossible pour le moment — réessayez.' };
  }

  updateTag(COMMUNITY_TAG);
  return { ok: true };
}
