/**
 * Shared helpers for the Phase 5 backend API tests (PDF §6).
 *
 * Runner: the Node.js built-in test runner (`node --test tests/`) — zero new
 * runtime dependencies, per the assessment's "smallest appropriate setup".
 *
 * Preconditions:
 * - Strapi running on `STRAPI_URL` (default http://localhost:1337);
 * - PostgreSQL seeded (11 categories + the 3 demo users of `src/utils/seed.ts`).
 *
 * Data safety: every fixture created by these tests is marked with the
 * `[PH5TEST]` prefix (title / content) and is removable with the documented
 * cleanup script `tests/cleanup-ph5.sql` — production (seed + demo) rows are
 * never touched, and the database is never reset.
 */

export const BASE = process.env.STRAPI_URL ?? 'http://localhost:1337';

/** Matches `SEED_USER_PASSWORD` of the backend seed (see src/utils/seed.ts). */
export const DEMO_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Demo!LeRevenu2026';

/** Marker allowing the documented, scoped cleanup of test rows only. */
export const FIXTURE_PREFIX = '[PH5TEST]';

export const UNIQUE_STAMP = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e5).toString(36)}`;

/** Minimal typed REST call against the live Strapi instance. */
export async function api(path, { method = 'GET', jwt, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON answer (proxy/gateway) — the test asserts on the status.
  }
  return { status: res.status, json, headers: res.headers };
}

/** Login a seeded demo member; returns `{ jwt, user }`. */
export async function login(identifier) {
  const { status, json } = await api('/api/auth/local', {
    method: 'POST',
    body: { identifier, password: DEMO_PASSWORD },
  });
  if (status !== 200 || !json?.jwt || !json?.user?.id) {
    throw new Error(`Login failed for "${identifier}" (HTTP ${status}) — is the DB seeded?`);
  }
  return json;
}

/** Collect the per-field validation errors of a 400 answer. */
export function fieldErrorsOf(json) {
  const errors = json?.error?.details?.errors;
  if (!Array.isArray(errors)) return {};
  return Object.fromEntries(errors.map((e) => [String(e.field), String(e.message)]));
}

let categoryRef = null;
/** documentId of an existing category (first of the seeded list). */
export async function someCategoryRef() {
  if (categoryRef) return categoryRef;
  const { status, json } = await api('/api/categories');
  if (status !== 200 || !json?.data?.length) throw new Error(`No categories readable (HTTP ${status})`);
  categoryRef = json.data[0].documentId;
  return categoryRef;
}

/** Valid discussion payload, uniquely named for the cleanup procedure. */
export async function validDiscussionInput({ title = null, author = undefined } = {}) {
  return {
    data: {
      title: title ?? `${FIXTURE_PREFIX} Discussion de test ${UNIQUE_STAMP()}`,
      content: `${FIXTURE_PREFIX} Contenu publie par la suite de tests d'integration de l'API REST (Phase 5).`,
      type: 'question',
      category: await someCategoryRef(),
      ...(author !== undefined ? { author } : {}),
    },
  };
}

/** Valid reply payload for an existing discussion. */
export function validReplyInput(discussionDocumentId) {
  return {
    data: {
      content: `${FIXTURE_PREFIX} Reponse de test de la suite d'integration (Phase 5).`,
      discussion: discussionDocumentId,
    },
  };
}
