/**
 * Typed Strapi REST API client (Phase 4).
 *
 * All calls to Strapi go through these functions and types: every page,
 * component and server action reads its data from Strapi here — never
 * through a parallel business backend (PDF §1). Next.js keeps talking to
 * PostgreSQL only through the running Strapi instance.
 *
 * Response shapes mirror the Phase 2 serializers:
 * - flat objects (Strapi v5 `documentId`, no nested `attributes`),
 * - only safe user fields (id + username) — never email/provider.
 */

const API_URL_BASE = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

const API_URL = API_URL_BASE.replace(/\/+$/, '');

/* ----------------------------- response types ----------------------------- */

/** Shape returned by the backend serializers — only id + username ever leave. */
export interface StrapiUserRef {
  id: number;
  username: string;
}

export interface StrapiCategoryJson {
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface StrapiReplyJson {
  documentId: string;
  content: string;
  createdAt: string;
  author?: StrapiUserRef | null;
}

export interface StrapiDiscussionJson {
  documentId: string;
  title: string;
  content: string;
  type: 'question' | 'discussion';
  createdAt: string;
  updatedAt: string;
  author?: StrapiUserRef | null;
  category?: StrapiCategoryJson | null;
  replies?: StrapiReplyJson[];
}

/** Pagination meta of the standard Strapi v5 list envelope. */
export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiList<T> {
  data: T[];
  meta?: { pagination?: StrapiPagination };
}

/** Field error produced by the Phase 2 server-side validation. */
export interface StrapiFieldError {
  field: string;
  message: string;
}

/** Strapi v5 error envelope (`{ data: null, error: {...} }`). */
export interface StrapiErrorJson {
  data?: null;
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: unknown;
  };
}

/** Typed error carrying the HTTP status and (when present) field errors. */
export class StrapiApiError extends Error {
  readonly status: number;
  readonly errorName?: string;
  readonly fieldErrors: StrapiFieldError[];

  constructor(
    status: number,
    errorName: string | undefined,
    message: string,
    fieldErrors: StrapiFieldError[]
  ) {
    super(message || `Erreur Strapi (HTTP ${status}).`);
    this.name = 'StrapiApiError';
    this.status = status;
    this.errorName = errorName;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Extract the per-field validation errors of a Strapi error payload.
 * The Phase 2 controllers answer `raw: 400 { error: { details: { errors } } }`.
 */
export function extractFieldErrors(errorJson?: StrapiErrorJson['error']): StrapiFieldError[] {
  if (!errorJson?.details || typeof errorJson.details !== 'object') return [];
  const details = errorJson.details as { errors?: unknown };
  if (!Array.isArray(details.errors)) return [];
  return details.errors
    .filter(
      (e): e is StrapiFieldError =>
        !!e && typeof e === 'object' && 'field' in e && typeof (e as StrapiFieldError).message === 'string'
    )
    .map((e) => ({ field: String(e.field), message: e.message }));
}

/* --------------------------------- client --------------------------------- */

/**
 * Perform a typed request against the Strapi REST API.
 *
 * - Passing `revalidate` (or `tags`) enables Next.js fetch caching for the
 *   cached data-layer reads; other calls are never cached.
 * - `jwt` attaches the Bearer token of a logged-in demo member.
 */
export async function strapiRequest<T>(
  path: string,
  init?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    jwt?: string;
    revalidate?: number | false;
    tags?: string[];
    timeoutMs?: number;
  }
): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init?.jwt) headers.Authorization = `Bearer ${init.jwt}`;

  const cacheable = init?.revalidate !== undefined || init?.tags !== undefined;

  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: cacheable ? undefined : 'no-store',
    // Danger-free request timeout so a stopped Strapi degrades to the app's
    // error state instead of hanging the render.
    signal: AbortSignal.timeout(init?.timeoutMs ?? (init?.method === undefined ? 8_000 : 15_000)),
    ...(cacheable ? { next: { revalidate: init?.revalidate, tags: init?.tags } } : {}),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err = (payload as StrapiErrorJson | null)?.error;
    const fieldErrors = extractFieldErrors(err);
    throw new StrapiApiError(
      res.status,
      err?.name,
      err?.message ?? '',
      fieldErrors
    );
  }

  return payload as T;
}

/** Escaped API base URL (used by the proxy for its direct slug lookup). */
export const STRAPI_BASE_URL = API_URL;
