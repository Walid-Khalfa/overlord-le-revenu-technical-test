/**
 * Explicit serializers for REST responses.
 * Only expose safe fields: never leak user email, provider, or internals.
 */

export const serializeUser = (user: any): { id: number; username: string } | null =>
  user ? { id: user.id, username: user.username } : null;

export const serializeCategory = (category: any) =>
  category
    ? {
        documentId: category.documentId,
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
      }
    : null;

export const serializeReply = (reply: any) => ({
  documentId: reply.documentId,
  content: reply.content,
  createdAt: reply.createdAt,
  author: serializeUser(reply.author),
  // Only present when the discussion relation was populated (list endpoint).
  ...(reply.discussion !== undefined
    ? { discussion: reply.discussion?.documentId ?? null }
    : {}),
});

export const serializeDiscussion = (discussion: any) => ({
  documentId: discussion.documentId,
  title: discussion.title,
  content: discussion.content,
  type: discussion.type,
  createdAt: discussion.createdAt,
  updatedAt: discussion.updatedAt,
  author: serializeUser(discussion.author),
  category: serializeCategory(discussion.category),
  ...(Array.isArray(discussion.replies)
    ? { replies: discussion.replies.map(serializeReply) }
    : {}),
});
