/**
 * Shared server-side validation helpers for the community API.
 * Validation lives in Strapi (backend), independently of any frontend control.
 */

export interface FieldError {
  field: string;
  message: string;
}

export const DISCUSSION_TYPES = ['question', 'discussion'] as const;
export type DiscussionType = (typeof DISCUSSION_TYPES)[number];

export const TITLE_MIN = 10;
export const TITLE_MAX = 150;
export const REPLY_MIN = 2;

type LooseRecord = Record<string, unknown>;

/**
 * Extract the `data` payload from a Strapi REST body (`{ data: {...} }`),
 * tolerating malformed bodies without ever throwing.
 */
export const readData = (body: unknown): LooseRecord => {
  if (body && typeof body === 'object' && 'data' in (body as LooseRecord)) {
    const data = (body as LooseRecord).data;
    if (data && typeof data === 'object') return data as LooseRecord;
  }
  return {};
};

/**
 * Normalize a relation reference coming from REST (documentId string or numeric id)
 * into a single string reference. Returns null when absent/invalid.
 */
export const asRelationRef = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

export interface DiscussionInput {
  title: string;
  content: string;
  type: DiscussionType;
  categoryRef: string | null;
}

/**
 * Validate the fields of a discussion payload.
 * Returns the cleaned values plus the list of field errors (empty when valid).
 */
export const validateDiscussionInput = (
  data: LooseRecord
): { values: DiscussionInput; errors: FieldError[] } => {
  const errors: FieldError[] = [];

  const title = typeof data.title === 'string' ? data.title.trim().replace(/\s+/g, ' ') : '';
  if (title.length < TITLE_MIN) {
    errors.push({ field: 'title', message: `Le titre doit contenir au moins ${TITLE_MIN} caractères.` });
  } else if (title.length > TITLE_MAX) {
    errors.push({ field: 'title', message: `Le titre ne doit pas dépasser ${TITLE_MAX} caractères.` });
  }

  const content = typeof data.content === 'string' ? data.content.trim() : '';
  if (content.length === 0) {
    errors.push({ field: 'content', message: 'Le contenu est obligatoire.' });
  }

  const type = typeof data.type === 'string' ? data.type : '';
  if (!(DISCUSSION_TYPES as readonly string[]).includes(type)) {
    errors.push({
      field: 'type',
      message: `Le type doit valoir « question » ou « discussion ».`,
    });
  }

  const categoryRef = asRelationRef(data.category);
  if (!categoryRef) {
    errors.push({ field: 'category', message: 'Une catégorie est obligatoire.' });
  }

  return {
    values: { title, content, type: type as DiscussionType, categoryRef },
    errors,
  };
};

export interface ReplyInput {
  content: string;
  discussionRef: string | null;
}

/**
 * Validate the fields of a reply payload.
 */
export const validateReplyInput = (data: LooseRecord): { values: ReplyInput; errors: FieldError[] } => {
  const errors: FieldError[] = [];

  const content = typeof data.content === 'string' ? data.content.trim() : '';
  if (content.length < REPLY_MIN) {
    errors.push({ field: 'content', message: `La réponse doit contenir au moins ${REPLY_MIN} caractères.` });
  }

  const discussionRef = asRelationRef(data.discussion);
  if (!discussionRef) {
    errors.push({ field: 'discussion', message: 'La réponse doit être rattachée à une discussion.' });
  }

  return { values: { content, discussionRef }, errors };
};
