# Technical review — 30-minute walkthrough plan

Realistic agenda for the review session, with the files to open and the live
demonstrations to run. Every claim is backed by the acceptance matrix
(`docs/acceptance-matrix.md`).

## 0:00–4:00 — Architecture overview

```
Browser
  │  HTML/RSC (streamed, PPR)         server actions (POST)
  ▼                                        │
Next.js 16 — App Router                    │
  ├─ pages: feed /, detail /discussions/<documentId>, /publier
  ├─ lib/community.ts  — data layer ('use cache' + cacheTag)
  ├─ lib/strapi.ts     — typed REST client (the ONLY Strapi caller)
  └─ app/actions/*     — login/logout + create discussion/reply
  │        ▲ JWT read from httpOnly cookie, sent as Bearer
  ▼        │
Strapi v5 (REST)  ── business logic, validation, permissions, persistence
  ▼
PostgreSQL 16 (Docker Compose)
```

Key principle (PDF §1): **business logic and persistence live in Strapi only**.
Next.js never touches PostgreSQL and implements no parallel backend — it renders
and relays the session.

## 4:00–9:00 — Strapi content models & API

Open: `backend/src/api/discussion/content-types/discussion/schema.json`,
`…/discussion/controllers/discussion.ts`, `backend/src/utils/{validation,serialize}.ts`,
`backend/src/index.ts` (permission bootstrap).

- Models: Category (name/slug/description) · Discussion (title/content/type +
  author + category + replies) · Reply (content + author + discussion); user =
  native Users & Permissions model.
- Custom `find`/`findOne`/`create` on discussion & reply: server-side populate
  (no N+1), flat serialization exposing only safe user fields (`id`, `username`),
  author **always** derived from the JWT, consistent HTTP errors
  (201 `{data}` / 400 with per-field `details.errors` / 403 / 404).
- Live demo: `curl` the list (200 + pagination meta), an unknown id (404), and
  an anonymous POST (403).

## 9:00–14:00 — Next.js data flow

Open: `frontend/lib/strapi.ts`, `frontend/lib/community.ts`, `frontend/app/page.tsx`,
`frontend/app/discussions/[slug]/page.tsx`, `frontend/proxy.ts`.

- Single typed client; the data layer caches reads with `'use cache'` +
  `cacheTag('community')` + `cacheLife('minutes')`; write actions call
  `updateTag('community')` → read-your-own-writes.
- URL is the state: `?espace=<slug>&tri=<key>` translates into backend
  `filters` / `sort` / `pagination` — filtering and date sorting run on Strapi.
- Cache Components / PPR: instant shell for `/` and `/publier`; the detail route
  is blocking (`export const instant = false`) because its URL only exists in
  Strapi (documentId); session-dependent panels stream behind `<Suspense>`.
- `proxy.ts` keeps real HTTP 404s for unknown ids (single Strapi lookup,
  fail-open so a Strapi outage degrades to the app's error state, never to a
  wrong authorization decision — the proxy has no authorization role).

## 14:00–18:00 — Authentication & permissions

Open: `frontend/app/actions/auth.ts`, `frontend/lib/auth.ts`, `backend/src/index.ts`.

- Login = server action → Strapi `/api/auth/local` → JWT stored in an
  **httpOnly** cookie (never readable by JS); display username in a second
  httpOnly cookie; logout deletes both.
- Threats covered: unauthenticated writes (403 — public role is read-only),
  author spoofing (server ignores the payload author), privilege creep
  (no update/delete permission for anyone; controller owner-rules add a second
  layer), XSS token theft (httpOnly).
- Live demo: publish attempt while logged out → in-form refusal message.

## 18:00–24:00 — Publication flows (live)

1. Log in as a demo member through the Espace membre panel.
2. `/publier`: submit a 9-character title → instant client error (mirrors the
   Strapi rule); fix it, choose category/type, submit → redirect to
   `/discussions/<new documentId>` (PDF §2.C).
3. Post a reply → appears immediately (action response re-renders the list).
4. Reload → still there (PostgreSQL persistence).
5. Optional: show the same flow in the Playwright suite
   (`frontend/e2e/community.spec.ts`, journey 5→10).

## 24:00–28:00 — Automated tests & quality gates

- Backend: `npm test` in `backend/` — Node built-in runner, 23 tests:
  validation boundaries, 403s, spoofing, reply association, security
  regressions (no private fields, no token leak, no open update/delete).
- E2E: `npx playwright test` in `frontend/` — 5 scenarios = the 10 mandatory
  journeys; plus `node e2e/mobile-check.mjs` (390×844 layout).
- Fixtures are marker-prefixed and removed by the documented idempotent SQL
  (`backend/tests/cleanup-ph5.sql`).
- Gates: `tsc --noEmit`, `eslint`, `next build`, `strapi build` — all exit 0.

## 28:00–30:00 — Tradeoffs, limitations, evolution

- “Tendances”/“Sans réponse” tabs derive from the populated page (no native
  relation-count sort in Strapi REST) → a dedicated backend endpoint is the
  natural next step.
- Feed pagination passes through the backend but renders one page (pageSize 25);
  search, votes and profiles are unimplemented bonuses by choice.
- Admin panel not bootstrapped (not needed by the scope); permission changes
  would go through it.
- `secure` cookie flag is opt-in for HTTPS deployments; the demo runs on http://localhost.
- Strapi regenerates `backend/types/generated/*.d.ts` on boot — EOL-only churn,
  content-identical (verified with `git diff --ignore-cr-at-eol`).
